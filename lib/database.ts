import { env } from 'cloudflare:workers';
import { FREE_ANALYSES_PER_WEEK } from '@/lib/quota';

let initialized = false;
let initializationPromise: Promise<void> | null = null;

export function database(): D1Database {
  if (!env.DB) throw new Error('D1 database binding is unavailable');
  return env.DB;
}

export async function ensureDatabase(): Promise<void> {
  if (initialized) return;
  const pending = initializationPromise ?? initializeDatabase();
  initializationPromise = pending;
  try {
    await pending;
    initialized = true;
  } finally {
    if (initializationPromise === pending) initializationPromise = null;
  }
}

async function initializeDatabase(): Promise<void> {
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
    `CREATE TABLE IF NOT EXISTS analysis_requests (
      subject_id TEXT NOT NULL,
      request_id TEXT NOT NULL,
      request_hash TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'complete', 'failed')),
      analysis_id TEXT,
      response_json TEXT,
      lease_id TEXT,
      lease_expires_at TEXT,
      reservation TEXT CHECK (reservation IN ('free', 'paid') OR reservation IS NULL),
      usage_period TEXT,
      reservation_user_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY(subject_id, request_id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_analysis_requests_updated
      ON analysis_requests(updated_at)`,
    `CREATE TABLE IF NOT EXISTS rate_limits (
      scope TEXT NOT NULL,
      identifier_hash TEXT NOT NULL,
      window_start TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
      PRIMARY KEY(scope, identifier_hash, window_start)
    )`,
  ];
  await db.batch(statements.map((statement) => db.prepare(statement)));
  const analysisColumns = await db.prepare('PRAGMA table_info(analyses)').all<{ name: string }>();
  const existingColumns = new Set((analysisColumns.results ?? []).map((column) => column.name));
  const compatibilityMigrations = [
    ['latency_ms', 'ALTER TABLE analyses ADD COLUMN latency_ms INTEGER'],
    ['input_tokens', 'ALTER TABLE analyses ADD COLUMN input_tokens INTEGER'],
    ['output_tokens', 'ALTER TABLE analyses ADD COLUMN output_tokens INTEGER'],
    ['total_tokens', 'ALTER TABLE analyses ADD COLUMN total_tokens INTEGER'],
    ['retry_count', 'ALTER TABLE analyses ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0'],
  ] as const;
  const pendingMigrations = compatibilityMigrations.filter(([column]) => !existingColumns.has(column));
  for (const [column, statement] of pendingMigrations) {
    try {
      await db.prepare(statement).run();
    } catch (error) {
      const refreshed = await db.prepare('PRAGMA table_info(analyses)').all<{ name: string }>();
      if (!(refreshed.results ?? []).some((item) => item.name === column)) throw error;
    }
  }
  const requestColumns = await db.prepare('PRAGMA table_info(analysis_requests)').all<{ name: string }>();
  const existingRequestColumns = new Set((requestColumns.results ?? []).map((item) => item.name));
  const requestMigrations = [
    ['request_hash', 'ALTER TABLE analysis_requests ADD COLUMN request_hash TEXT'],
    ['lease_id', 'ALTER TABLE analysis_requests ADD COLUMN lease_id TEXT'],
    ['lease_expires_at', 'ALTER TABLE analysis_requests ADD COLUMN lease_expires_at TEXT'],
    ['reservation', 'ALTER TABLE analysis_requests ADD COLUMN reservation TEXT'],
    ['usage_period', 'ALTER TABLE analysis_requests ADD COLUMN usage_period TEXT'],
    ['reservation_user_id', 'ALTER TABLE analysis_requests ADD COLUMN reservation_user_id TEXT'],
  ] as const;
  for (const [column, statement] of requestMigrations) {
    if (existingRequestColumns.has(column)) continue;
    try {
      await db.prepare(statement).run();
    } catch (error) {
      const refreshed = await db.prepare('PRAGMA table_info(analysis_requests)').all<{ name: string }>();
      if (!(refreshed.results ?? []).some((item) => item.name === column)) throw error;
    }
  }
  const quotaTriggers = [
    `CREATE TRIGGER IF NOT EXISTS trg_analysis_request_reserve_free
      BEFORE UPDATE OF reservation ON analysis_requests
      WHEN OLD.reservation IS NULL AND NEW.reservation = 'free'
      BEGIN
        INSERT INTO daily_usage(subject_id, usage_date, count) VALUES(NEW.subject_id, NEW.usage_period, 1)
          ON CONFLICT(subject_id, usage_date) DO UPDATE SET count = count + 1 WHERE count < ${FREE_ANALYSES_PER_WEEK};
        SELECT CASE WHEN changes() = 0 THEN RAISE(IGNORE) END;
      END`,
    `CREATE TRIGGER IF NOT EXISTS trg_analysis_request_reserve_paid
      BEFORE UPDATE OF reservation ON analysis_requests
      WHEN OLD.reservation IS NULL AND NEW.reservation = 'paid'
      BEGIN
        UPDATE credit_balances SET credits = credits - 1, updated_at = datetime('now')
          WHERE user_id = NEW.reservation_user_id AND credits > 0;
        SELECT CASE WHEN changes() = 0 THEN RAISE(IGNORE) END;
      END`,
    `CREATE TRIGGER IF NOT EXISTS trg_analysis_request_refund_free
      AFTER UPDATE OF reservation ON analysis_requests
      WHEN OLD.reservation = 'free' AND NEW.reservation IS NULL AND NEW.status = 'failed'
      BEGIN
        UPDATE daily_usage SET count = MAX(count - 1, 0)
          WHERE subject_id = NEW.subject_id AND usage_date = OLD.usage_period;
      END`,
    `CREATE TRIGGER IF NOT EXISTS trg_analysis_request_refund_paid
      AFTER UPDATE OF reservation ON analysis_requests
      WHEN OLD.reservation = 'paid' AND NEW.reservation IS NULL AND NEW.status = 'failed'
      BEGIN
        UPDATE credit_balances SET credits = credits + 1, updated_at = datetime('now')
          WHERE user_id = OLD.reservation_user_id;
      END`,
  ];
  await db.batch(quotaTriggers.map((statement) => db.prepare(statement)));
  await db.batch([
    db.prepare(`UPDATE analysis_requests SET status = 'failed', reservation = NULL, usage_period = NULL, reservation_user_id = NULL,
      lease_id = NULL, lease_expires_at = NULL, updated_at = ?
      WHERE status = 'pending' AND (lease_expires_at IS NULL OR datetime(lease_expires_at) <= datetime(?))`)
      .bind(new Date().toISOString(), new Date().toISOString()),
    db.prepare(`DELETE FROM feedback WHERE analysis_id IN (SELECT id FROM analyses WHERE datetime(created_at) < datetime('now', '-90 days'))`),
    db.prepare(`DELETE FROM analyses WHERE datetime(created_at) < datetime('now', '-90 days')`),
    db.prepare(`DELETE FROM analysis_requests WHERE status != 'pending' AND datetime(updated_at) < datetime('now', '-90 days')`),
    db.prepare(`DELETE FROM rate_limits WHERE datetime(window_start) < datetime('now', '-2 days')`),
    db.prepare(`DELETE FROM analytics_events WHERE datetime(created_at) < datetime('now', '-90 days')`),
    db.prepare(`DELETE FROM ai_requests WHERE datetime(created_at) < datetime('now', '-90 days')`),
  ]);
  await db.prepare('PRAGMA optimize').run();
}
