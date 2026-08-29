import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';

const allowedEvents = new Set(['landing_viewed', 'language_changed', 'example_selected', 'sample_viewed', 'analysis_submitted', 'analysis_completed', 'analysis_failed', 'analysis_viewed', 'analysis_shared', 'followup_selected', 'paywall_viewed', 'checkout_started', 'feedback_submitted', 'source_clicked', 'contact_clicked', 'share_clicked']);

export async function POST(request: NextRequest) {
  let body: { event?: unknown; properties?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (typeof body.event !== 'string' || !allowedEvents.has(body.event)) return NextResponse.json({ ok: false }, { status: 400 });
  const properties = body.properties && typeof body.properties === 'object' && JSON.stringify(body.properties).length < 2000 ? body.properties : {};
  const subject = request.cookies.get('asknaval_visitor')?.value ?? null;
  await ensureDatabase();
  await database().prepare('INSERT INTO analytics_events(id, subject_id, event_name, properties_json, created_at) VALUES(?, ?, ?, ?, ?)').bind(crypto.randomUUID(), subject, body.event, JSON.stringify(properties), new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
