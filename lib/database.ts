import { env } from 'cloudflare:workers';

let initialized = false;

export function database(): D1Database {
  if (!env.DB) throw new Error('D1 database binding is unavailable');
  return env.DB;
}

export async function ensureDatabase(): Promise<void> {
  if (initialized) return;
  const db = database();
  const statements = [
    `CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      user_id TEXT,
      locale TEXT NOT NULL CHECK (locale IN ('zh', 'en')),
      topic TEXT NOT NULL,
      question TEXT NOT NULL,
      result_json TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('live', 'demo')),
      model_name TEXT,
      prompt_version TEXT NOT NULL,
      latency_ms INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      total_tokens INTEGER,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analyses_subject_created
      ON analyses(subject_id, created_at)`,
    `CREATE TABLE IF NOT EXISTS daily_usage (
      subject_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
      PRIMARY KEY(subject_id, usage_date)
    )`,
    `CREATE TABLE IF NOT EXISTS credit_balances (
      user_id TEXT PRIMARY KEY,
      credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS entitlement_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      analysis_id TEXT,
      payment_event_id TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_entitlement_ledger_user
      ON entitlement_ledger(user_id, created_at)`,
    `CREATE TABLE IF NOT EXISTS feedback (
      analysis_id TEXT PRIMARY KEY,
      rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      event_name TEXT NOT NULL,
      properties_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analytics_event_created
      ON analytics_events(event_name, created_at)`,
    `CREATE TABLE IF NOT EXISTS payment_events (
      provider_event_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount_total INTEGER,
      currency TEXT,
      credits INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS ai_requests (
      id TEXT PRIMARY KEY,
      subject_id TEXT,
      model_name TEXT NOT NULL,
      latency_ms INTEGER NOT NULL,
      input_tokens INTEGER,
      output_tokens INTEGER,
      total_tokens INTEGER,
      success INTEGER NOT NULL CHECK (success IN (0, 1)),
      retry_count INTEGER NOT NULL DEFAULT 0,
      error_code TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_ai_requests_created
      ON ai_requests(created_at)`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      scope TEXT NOT NULL,
      identifier_hash TEXT NOT NULL,
      window_start TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
      PRIMARY KEY(scope, identifier_hash, window_start)
    )`,
  ];
  await db.batch(statements.map((statement) => db.prepare(statement)));
  await db.prepare('PRAGMA optimize').run();
  initialized = true;
}
