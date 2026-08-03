import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

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

// Initialize schema
const schemaPath = path.resolve('database/schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('✅ Database schema initialized from database/schema.sql');
} else {
  console.error('❌ Could not find database/schema.sql');
}

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

export default db;
