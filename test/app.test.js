import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/index.js';
import db from '../database/db.js';
import { calculateEnergyConsumed, calculateDrivingRange, calculateEffectiveChargingPower } from '../src/utils/evCalculations.js';

describe('1. Zero Mock Data & OpenStreetMap Strict Translation', () => {
  it('should not invent or infer charging power if OSM tag is missing', async () => {
    const mockOsmElement = {
      type: 'node',
      id: 999888,
      lat: 13.75,
      lon: 100.50,
      tags: {
        'amenity': 'charging_station',
        'brand': 'Tesla Supercharger', // Brand says Supercharger, but no power tag
        'socket:type2': '1'
      }
    };

    const module = await import('../server/services/overpassProxy.js');
    const parsed = module.default.parseOsmElement(mockOsmElement);
    expect(parsed.power_output_kw).toBeNull(); // NEVER infer 250kW just from brand!
    expect(parsed.provider).toBe('Tesla Supercharger');
  });
});

describe('2. EV Smart Trip Planner & Mandatory Estimate Labeling', () => {
  it('should strictly append "Estimate / ค่าประมาณ" to energy consumed calculations', () => {
    const res = calculateEnergyConsumed(200, 15.0); // 30 kWh
    expect(res.value).toBe(30);
    expect(res.label).toContain('Estimate');
    expect(res.display).toContain('(Estimate)');
  });

  it('should accurately compute driving range and attach estimate label', () => {
    const res = calculateDrivingRange(50, 16.0); // 312.5 km
    expect(res.value).toBe(312.5);
    expect(res.label).toContain('Estimate');
  });

  it('should correctly handle stations without known power output', () => {
    const res = calculateEffectiveChargingPower(150, null);
    expect(res.isKnown).toBe(false);
    expect(res.display).toContain('ไม่มีข้อมูลกำลังไฟสถานี');
  });

  it('POST /api/route should validate input and return estimate notice', async () => {
    const response = await request(app).post('/api/route').send({
      origin: { lat: 13.7563, lng: 100.5018 },
      destination: { lat: 18.7883, lng: 98.9853 },
      strategy: 'fastest',
      vehicle: { batteryCapacity: 60, consumptionRate: 15 }
    });
    expect(response.status).toBe(200);
    expect(response.body.notice).toContain('Estimate');
  });
});

describe('3. Community Verification & Asia/Bangkok Timezone Compliance', () => {
  let userToken = '';

  beforeAll(async () => {
    // Insert a test station in stations_cache so foreign key constraint passes
    try {
      db.prepare(`
        INSERT OR IGNORE INTO stations_cache (osm_id, osm_type, name, lat, lng, provider, connectors_json, osm_url)
        VALUES ('test_station_01', 'node', 'Test EV Station', 13.75, 100.50, 'PEA VOLTA', '[{"type":"CCS2","count":1}]', 'https://openstreetmap.org/node/1')
      `).run();
    } catch (e) {}

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'somchai@ev.th',
      password: 'user12345'
    });
    userToken = loginRes.body.token;
  });

  it('should format verification timestamp strictly in Asia/Bangkok Timezone', async () => {
    const res = await request(app).post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        station_osm_id: 'test_station_01',
        connector_status: 'working',
        vehicles_waiting: 1,
        cleanliness_rating: 5,
        safety_rating: 5
      });
    expect(res.status).toBe(201);
    expect(res.body.verified_at_bkk).toContain('(Asia/Bangkok)');
    expect(res.body.status_label).toBe('User report');
  });
});

describe('4. Analytics Dashboard Zero Fabricated Data Rule', () => {
  it('should report actual loaded counts without inventing statistics', async () => {
    const res = await request(app).get('/api/analytics');
    expect(res.status).toBe(200);
    expect(res.body.data_source || res.body.notice).toMatch(/actual loaded|No fabricated statistics/i);
  });
});
