import jwt from 'jsonwebtoken';
import db from '../../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_local_dev_jwt_secret_key_app_ev';

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'เข้าสู่ระบบไม่สำเร็จ หรือไม่มี 토เค็นยืนยันตัวตน (Authentication Token Missing)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'โทเค็นหมดอายุหรือไม่ถูกต้อง (Invalid or Expired Token)' });
  }
}

// Role-based Access Control Middleware
export function requireRole(allowedRoles = ['user', 'moderator', 'admin']) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `คุณสมบัติผู้ใช้ไม่เพียงพอ ต้องเป็นระดับ: ${allowedRoles.join(', ')} (Insufficient Role Permission)` 
      });
    }
    next();
  };
}

// Audit Logging helper
export function logAuditAction(userId, userName, action, targetId = null, details = null) {
  try {
    const insert = db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, action, target_id, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    insert.run(logId, userId || 'SYSTEM', userName || 'Anonym/System', action, targetId, details ? JSON.stringify(details) : null);
  } catch (e) {
    console.error(`❌ [AuditLog] Failed to record log:`, e.message);
  }
}

export { JWT_SECRET };
