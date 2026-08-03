-- App_EV Thailand Relational Database Schema
-- Designed for SQLite / PostgreSQL compatibility

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
  connector_status TEXT NOT NULL CHECK(connector_status IN ('working', 'faulty', 'unknown')),
  vehicles_waiting INTEGER DEFAULT 0,
  station_open BOOLEAN DEFAULT 1,
  observed_price TEXT NULL,
  connector_types_found TEXT NULL,
  photo_url TEXT NULL,
  cleanliness_rating INTEGER DEFAULT 5 CHECK(cleanliness_rating BETWEEN 1 AND 5),
  safety_rating INTEGER DEFAULT 5 CHECK(safety_rating BETWEEN 1 AND 5),
  facilities_notes TEXT NULL,
  verified_status TEXT DEFAULT 'Not yet verified' CHECK(verified_status IN ('User report', 'Not yet verified', 'Confirmed by multiple users', 'Verified by an administrator', 'Provider-supplied data')),
  confirm_count INTEGER DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,
  user_lat REAL NULL,
  user_lng REAL NULL,
  report_source TEXT DEFAULT 'Community app report',
  verified_at_bkk TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_osm_id) REFERENCES stations_cache(osm_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_votes (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('confirm', 'dispute')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, user_id),
  FOREIGN KEY (report_id) REFERENCES community_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  user_name TEXT NULL,
  action TEXT NOT NULL,
  target_id TEXT NULL,
  details TEXT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stations_provider ON stations_cache(provider);
CREATE INDEX IF NOT EXISTS idx_stations_coords ON stations_cache(lat, lng);
CREATE INDEX IF NOT EXISTS idx_reports_station ON community_reports(station_osm_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON community_reports(verified_status);
