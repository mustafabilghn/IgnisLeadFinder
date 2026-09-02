import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS searches (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  category TEXT NOT NULL,
  max_results INTEGER NOT NULL,
  provider TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  search_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_scanned_at TEXT,

  source TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT,
  district TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  website TEXT,
  google_maps_url TEXT,
  rating REAL,
  review_count INTEGER,

  website_scan_json TEXT,
  signals_json TEXT NOT NULL DEFAULT '[]',
  score_total INTEGER NOT NULL DEFAULT 0,
  score_priority TEXT NOT NULL DEFAULT 'low',
  score_json TEXT NOT NULL DEFAULT '{}',

  b2b_signal INTEGER NOT NULL DEFAULT 0,
  dealer_signal INTEGER NOT NULL DEFAULT 0,
  technical_signal INTEGER NOT NULL DEFAULT 0,
  whatsapp_signal INTEGER NOT NULL DEFAULT 0,
  has_website INTEGER NOT NULL DEFAULT 0,

  ai_summary TEXT,
  discovery_questions_json TEXT,
  outreach_message TEXT,

  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,

  UNIQUE(source, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_search_id ON leads(search_id);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score_total DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
`;

declare global {
  // eslint-disable-next-line no-var
  var __ignisDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (globalThis.__ignisDb) return globalThis.__ignisDb;

  const dbPath = process.env.DATABASE_PATH || "./data/ignis.sqlite";
  const resolved = path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  const db = new DatabaseSync(resolved);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(SCHEMA);

  globalThis.__ignisDb = db;
  return db;
}
