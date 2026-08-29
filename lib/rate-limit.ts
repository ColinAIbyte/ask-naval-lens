export async function checkRateLimit(db: D1Database, scope: string, identifier: string, limit: number, windowMinutes: number): Promise<boolean> {
  const identifierHash = await hashIdentifier(identifier);
  const windowMs = windowMinutes * 60_000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();
  const row = await db.prepare(`INSERT INTO rate_limits(scope, identifier_hash, window_start, count) VALUES(?, ?, ?, 1)
    ON CONFLICT(scope, identifier_hash, window_start) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
    .bind(scope, identifierHash, windowStart, limit).first<{ count: number }>();
  return Boolean(row);
}

export async function hasDailyModelBudget(db: D1Database): Promise<boolean> {
  const configured = Number.parseInt(process.env.OPENAI_DAILY_REQUEST_LIMIT || '250', 10);
  const limit = Number.isFinite(configured) && configured > 0 ? configured : 250;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const row = await db.prepare('SELECT COUNT(*) AS count FROM ai_requests WHERE created_at >= ?').bind(start.toISOString()).first<{ count: number }>();
  return (row?.count ?? 0) < limit;
}

async function hashIdentifier(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
