import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';
import { InvalidMiniSessionError } from '@/lib/mini-session';
import { checkRateLimit } from '@/lib/rate-limit';
import { resolveRequestSubject } from '@/lib/request-subject';

const allowedEvents = new Set(['landing_viewed', 'language_changed', 'example_selected', 'sample_viewed', 'analysis_submitted', 'analysis_completed', 'analysis_failed', 'analysis_viewed', 'analysis_shared', 'share_started', 'followup_selected', 'paywall_viewed', 'checkout_started', 'checkout_unavailable', 'signin_clicked', 'feedback_submitted', 'source_clicked', 'contact_clicked', 'share_clicked']);

export async function POST(request: NextRequest) {
  let body: { event?: unknown; properties?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (typeof body.event !== 'string' || !allowedEvents.has(body.event)) return NextResponse.json({ ok: false }, { status: 400 });
  const properties = sanitizeProperties(body.properties);
  let identity;
  try {
    identity = await resolveRequestSubject(request);
  } catch (error) {
    if (error instanceof InvalidMiniSessionError) return NextResponse.json({ ok: false }, { status: 401 });
    throw error;
  }
  await ensureDatabase();
  const db = database();
  const ipIdentity = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const rateIdentity = identity.subjectId ?? `ip:${ipIdentity}`;
  const [subjectAllowed, ipAllowed] = await Promise.all([
    checkRateLimit(db, 'events_subject_10m', rateIdentity, 120, 10),
    checkRateLimit(db, 'events_ip_10m', ipIdentity, 300, 10),
  ]);
  if (!subjectAllowed || !ipAllowed) return NextResponse.json({ ok: false }, { status: 429 });
  await db.prepare('INSERT INTO analytics_events(id, subject_id, event_name, properties_json, created_at) VALUES(?, ?, ?, ?, ?)').bind(crypto.randomUUID(), identity.subjectId, body.event, JSON.stringify(properties), new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}

function sanitizeProperties(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowedKeys = new Set(['locale', 'platform', 'topic', 'analysis_id', 'rating', 'status', 'source_url', 'trigger', 'plan_id', 'reason', 'example_id', 'from_locale', 'to_locale', 'placement']);
  const output: Record<string, string | number | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!allowedKeys.has(key) || !['string', 'number', 'boolean'].includes(typeof item)) continue;
    if (typeof item === 'string' && item.length > 200) continue;
    output[key] = item as string | number | boolean;
  }
  return output;
}
