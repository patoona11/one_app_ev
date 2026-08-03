import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/db.js';
import overpassService from './services/overpassProxy.js';
import routingAdapter from './services/routingAdapter.js';
import { verifyToken, requireRole, logAuditAction, JWT_SECRET } from './middleware/auth.js';
import { globalLimiter, reportSubmissionLimiter, authLimiter } from './middleware/rateLimiter.js';
import { validateBody, reportSchema, routeRequestSchema } from './middleware/validator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use(globalLimiter);

// ============================================================================
// 1. MODULE 1: EV STATION MAP & OVERPASS PROXY ENDPOINTS
// ============================================================================
app.get('/api/stations', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const result = await overpassService.getStations(forceRefresh);
    res.json(result);
  } catch (err) {
    console.error(`❌ [API /stations] Error:`, err.message);
    res.status(503).json({ 
      error: err.message || 'Charging-station data is currently unavailable.',
      notice: 'ระบบกำลังเผชิญหน้าปัญหาการสื่อสารกับ OpenStreetMap โปรดลองใหม่อีกครั้ง' 
    });
  }
});

// ============================================================================
// 2. MODULE 2: EV SMART TRIP PLANNER ENDPOINT (PRIMARY FEATURE)
// ============================================================================
app.post('/api/route', validateBody(routeRequestSchema), async (req, res) => {
  try {
    const { origin, destination, waypoints = [], strategy = 'fastest', vehicle = {} } = req.body;
    const pathPoints = [origin, ...waypoints, destination];

    const tripResult = await routingAdapter.getRoute(pathPoints, strategy, vehicle);
    res.json({
      success: true,
      strategy_chosen: strategy,
      route: tripResult,
      notice: 'คำอธิบาย: การคำนวณระยะเวลาเดินทางและพลังงานชาร์จเป็น "Estimate (ค่าประมาณ)" ขึ้นอยู่กับการจราจรและสภาพแบตเตอรี่จริง'
    });
  } catch (err) {
    console.error(`❌ [API /route] Error:`, err.message);
    res.status(500).json({ error: `ไม่สามารถคำนวณเส้นทางได้: ${err.message}` });
  }
});

// ============================================================================
// 3. MODULE 3: COMMUNITY VERIFICATION ENDPOINTS & REPORTS
// ============================================================================
app.get('/api/reports/:stationOsmId', (req, res) => {
  try {
    const { stationOsmId } = req.params;
    const reports = db.prepare(`
      SELECT * FROM community_reports 
      WHERE station_osm_id = ? 
      ORDER BY created_at DESC
    `).all(stationOsmId);
    res.json({ success: true, count: reports.length, reports });
  } catch (e) {
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลรายงานผู้ใช้ได้' });
  }
});

app.post('/api/reports', reportSubmissionLimiter, verifyToken, validateBody(reportSchema), (req, res) => {
  try {
    const data = req.body;
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Create timestamp strictly in Asia/Bangkok Timezone
    const bkkFormatter = new Intl.DateTimeFormat('th-TH', { 
      timeZone: 'Asia/Bangkok', 
      dateStyle: 'medium', 
      timeStyle: 'medium' 
    });
    const verifiedAtBkk = `${bkkFormatter.format(new Date())} (Asia/Bangkok)`;

    const insert = db.prepare(`
      INSERT INTO community_reports 
      (id, station_osm_id, user_id, user_name, connector_status, vehicles_waiting, station_open, observed_price, connector_types_found, photo_url, cleanliness_rating, safety_rating, facilities_notes, verified_status, user_lat, user_lng, verified_at_bkk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      reportId, data.station_osm_id, req.user.id, req.user.name, data.connector_status,
      data.vehicles_waiting, data.station_open ? 1 : 0, data.observed_price || null,
      data.connector_types_found || null, data.photo_url || null, data.cleanliness_rating,
      data.safety_rating, data.facilities_notes || null, 'User report', data.user_lat || null,
      data.user_lng || null, verifiedAtBkk
    );

    logAuditAction(req.user.id, req.user.name, 'SUBMIT_REPORT', reportId, { station: data.station_osm_id });

    res.status(201).json({ 
      success: true, 
      message: 'บันทึกรายงานสถานะตู้ชาร์จเรียบร้อยแล้ว (Report Submitted Successfully)', 
      report_id: reportId,
      verified_at_bkk: verifiedAtBkk,
      status_label: 'User report'
    });
  } catch (err) {
    console.error(`❌ [API /reports] Error:`, err.message);
    res.status(500).json({ error: 'บันทึกรายงานล้มเหลว' });
  }
});

// Vote confirm or dispute on a community report
app.post('/api/reports/:id/vote', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'confirm' or 'dispute'
    if (!['confirm', 'dispute'].includes(voteType)) {
      return res.status(400).json({ error: 'ประเภทการโหวตต้องเป็น confirm หรือ disputeเท่านั้น' });
    }

    // Insert or replace vote
    const upsertVote = db.prepare(`
      INSERT OR REPLACE INTO report_votes (id, report_id, user_id, vote_type, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    upsertVote.run(`${id}_${req.user.id}`, id, req.user.id, voteType);

    // Recompute counts and verification status label
    const confirmCnt = db.prepare("SELECT COUNT(*) as cnt FROM report_votes WHERE report_id = ? AND vote_type = 'confirm'").get(id).cnt;
    const disputeCnt = db.prepare("SELECT COUNT(*) as cnt FROM report_votes WHERE report_id = ? AND vote_type = 'dispute'").get(id).cnt;

    let statusLabel = 'Not yet verified';
    if (confirmCnt >= 3 && confirmCnt > disputeCnt * 2) {
      statusLabel = 'Confirmed by multiple users';
    } else if (disputeCnt >= 3 && disputeCnt >= confirmCnt) {
      statusLabel = 'Not yet verified (Disputed)';
    }

    db.prepare('UPDATE community_reports SET confirm_count = ?, dispute_count = ?, verified_status = ? WHERE id = ?')
      .run(confirmCnt, disputeCnt, statusLabel, id);

    logAuditAction(req.user.id, req.user.name, 'VOTE_REPORT', id, { vote: voteType, new_status: statusLabel });

    res.json({ success: true, confirm_count: confirmCnt, dispute_count: disputeCnt, verified_status: statusLabel });
  } catch (err) {
    res.status(500).json({ error: `บันทึกเสียงโหวตไม่สำเร็จ: ${err.message}` });
  }
});

// ============================================================================
// 4. ANALYTICS DASHBOARD ENDPOINT (REAL LOADED DATA ONLY)
// ============================================================================
app.get('/api/analytics', (req, res) => {
  try {
    // Total number of stations actually loaded from cache
    const totalStationsRow = db.prepare('SELECT COUNT(*) as total, MAX(last_updated) as last_updated FROM stations_cache').get();
    const total = totalStationsRow.total || 0;

    if (total === 0) {
      return res.json({
        success: true,
        data_source: 'No fabricated statistics when data cannot be loaded (Actual count: 0)',
        total_stations: 0,
        notice: 'ยังไม่มีข้อมูลสถานีในระบบ ไม่มีการสุ่มตัวเลขเสมือน (No fabricated statistics when data cannot be loaded)',
        province_distribution: [],
        provider_distribution: [],
        connector_distribution: [],
        power_output_stats: { percentage_with_power: 0, percentage_without_power: 0 },
        recent_fault_reports: 0
      });
    }

    // Number of stations by province
    const provinceDist = db.prepare('SELECT province, COUNT(*) as count FROM stations_cache GROUP BY province ORDER BY count DESC').all();

    // Number of stations by provider
    const providerDist = db.prepare('SELECT provider, COUNT(*) as count FROM stations_cache GROUP BY provider ORDER BY count DESC').all();

    // Power output presence stats
    const withPower = db.prepare('SELECT COUNT(*) as cnt FROM stations_cache WHERE power_output_kw IS NOT NULL').get().cnt;
    const pctWithPower = parseFloat(((withPower / total) * 100).toFixed(1));
    const pctWithoutPower = parseFloat((100 - pctWithPower).toFixed(1));

    // Fault reports in last 30 days
    const faultCount = db.prepare("SELECT COUNT(*) as cnt FROM community_reports WHERE connector_status = 'faulty' AND created_at >= datetime('now', '-30 days')").get().cnt;

    // Connector type parsing distribution across real cache
    const allCache = db.prepare('SELECT connectors_json FROM stations_cache').all();
    const connectorCounts = { 'CCS2': 0, 'Type 2': 0, 'CHAdeMO': 0, 'Tesla Supercharger': 0, 'Other': 0 };

    allCache.forEach(row => {
      try {
        const conns = JSON.parse(row.connectors_json);
        conns.forEach(c => {
          if (c.type.includes('CCS2')) connectorCounts['CCS2'] += c.count || 1;
          else if (c.type.includes('Type 2')) connectorCounts['Type 2'] += c.count || 1;
          else if (c.type.includes('CHAdeMO')) connectorCounts['CHAdeMO'] += c.count || 1;
          else if (c.type.includes('Tesla')) connectorCounts['Tesla Supercharger'] += c.count || 1;
          else connectorCounts['Other'] += c.count || 1;
        });
      } catch (_) {}
    });

    res.json({
      success: true,
      data_source: 'Calculated from actual loaded OpenStreetMap & Community database',
      last_updated: totalStationsRow.last_updated ? totalStationsRow.last_updated + 'Z' : null,
      total_stations: total,
      province_distribution: provinceDist,
      provider_distribution: providerDist,
      connector_distribution: Object.entries(connectorCounts).map(([type, count]) => ({ type, count })),
      power_output_stats: {
        with_power_count: withPower,
        without_power_count: total - withPower,
        percentage_with_power: pctWithPower,
        percentage_without_power: pctWithoutPower
      },
      recent_fault_reports: faultCount
    });
  } catch (err) {
    console.error('❌ [API /analytics] Error:', err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการคำนวณสถิติ' });
  }
});

// ============================================================================
// 5. AUTHENTICATION & ADMIN ENDPOINTS
// ============================================================================
app.post('/api/auth/login', authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  logAuditAction(user.id, user.name, 'USER_LOGIN');
  
  res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Admin Moderation: override verification status
app.put('/api/admin/reports/:id/verify', verifyToken, requireRole(['admin', 'moderator']), (req, res) => {
  const { id } = req.params;
  const { statusLabel } = req.body; // e.g. 'Verified by an administrator' or 'Provider-supplied data'
  
  try {
    db.prepare('UPDATE community_reports SET verified_status = ? WHERE id = ?').run(statusLabel || 'Verified by an administrator', id);
    logAuditAction(req.user.id, req.user.name, 'ADMIN_VERIFY_REPORT', id, { new_status: statusLabel });
    res.json({ success: true, message: 'สถานะได้รับการยืนยันโดยผู้ดูแลระบบแล้ว' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/logs', verifyToken, requireRole(['admin', 'moderator']), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json({ success: true, logs });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡ [App_EV Thailand] Backend API Service Layer running cleanly on port ${PORT}`);
  });
}

export default app;
