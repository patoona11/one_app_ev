import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION);
const dbPath = isVercel 
  ? '/tmp/ev_thailand.db' 
  : (process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('./', '') : 'database/ev_thailand.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys and WAL mode for higher read/write concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Built-in SQL schema to guarantee database creation on Vercel serverless / cold starts
const defaultSchemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations_cache (
  osm_id TEXT PRIMARY KEY,
  osm_type TEXT NOT NULL,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  provider TEXT NOT NULL,
  connectors_json TEXT NOT NULL,
  power_output_kw REAL NULL,
  price_info TEXT NULL,
  open_hours TEXT NULL,
  address TEXT NULL,
  province TEXT NULL,
  osm_url TEXT NOT NULL,
  raw_tags_json TEXT NULL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  station_osm_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  connector_status TEXT NOT NULL,
  vehicles_waiting INTEGER DEFAULT 0,
  station_open BOOLEAN DEFAULT 1,
  observed_price TEXT NULL,
  connector_types_found TEXT NULL,
  photo_url TEXT NULL,
  cleanliness_rating INTEGER DEFAULT 5,
  safety_rating INTEGER DEFAULT 5,
  facilities_notes TEXT NULL,
  verified_status TEXT DEFAULT 'Not yet verified',
  confirm_count INTEGER DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,
  user_lat REAL NULL,
  user_lng REAL NULL,
  report_source TEXT DEFAULT 'Community app report',
  verified_at_bkk TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_osm_id) REFERENCES stations_cache(osm_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_votes (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT CHECK(vote_type IN ('confirm', 'dispute')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, user_id),
  FOREIGN KEY (report_id) REFERENCES community_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  action TEXT NOT NULL,
  details TEXT NULL,
  ip_address TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(defaultSchemaSql);
console.log('✅ Database schema verified and initialized');

// Seed default accounts if database is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('admin12345', 10);
  const userHash = bcrypt.hashSync('user12345', 10);

  insertUser.run('adm_01', 'Admin EV Thailand', 'admin@appev.th', adminHash, 'admin');
  insertUser.run('usr_01', 'Somchai GreenEV', 'somchai@ev.th', userHash, 'user');

  console.log('🌱 Seeded default admin (admin@appev.th / admin12345) and regular user');
}

// Seed stations_cache with verified real OSM stations on cold start
const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations_cache').get().count;
if (stationCount === 0) {
  try {
    const seedStations = require('./stations_seed.json');
    if (Array.isArray(seedStations) && seedStations.length > 0) {
      const insertStation = db.prepare(`
        INSERT OR REPLACE INTO stations_cache 
        (osm_id, osm_type, name, lat, lng, provider, connectors_json, power_output_kw, price_info, open_hours, address, province, osm_url, raw_tags_json, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      const seedTx = db.transaction((list) => {
        for (const s of list) {
          insertStation.run(
            s.osm_id, s.osm_type, s.name, s.lat, s.lng, s.provider, s.connectors_json,
            s.power_output_kw, s.price_info, s.open_hours, s.address, s.province, s.osm_url, s.raw_tags_json
          );
        }
      });

      seedTx(seedStations);
      console.log(`⚡ Seeded ${seedStations.length} verified real OSM stations into database cache`);
    }
  } catch (seedErr) {
    console.warn(`⚠️ [Database] stations_seed.json could not be loaded:`, seedErr.message);
  }
}

export default db;
