export async function recoverExpiredReservationsForSubject(db: D1Database, subjectId: string): Promise<void> {
  const now = new Date().toISOString();
  const expired = await db.prepare(`SELECT request_id, lease_id, lease_expires_at
    FROM analysis_requests
    WHERE subject_id = ? AND status = 'pending'
      AND (lease_expires_at IS NULL OR datetime(lease_expires_at) <= datetime(?))
    ORDER BY updated_at ASC LIMIT 10`)
    .bind(subjectId, now)
    .all<{ request_id: string; lease_id: string | null; lease_expires_at: string | null }>();

  for (const request of expired.results ?? []) {
    const recoveryLeaseId = crypto.randomUUID();
    const claimed = await db.prepare(`UPDATE analysis_requests SET lease_id = ?, lease_expires_at = ?, updated_at = ?
      WHERE subject_id = ? AND request_id = ? AND status = 'pending'
        AND COALESCE(lease_id, '') = ? AND COALESCE(lease_expires_at, '') = ?
        AND (lease_expires_at IS NULL OR datetime(lease_expires_at) <= datetime(?))
      RETURNING request_id`)
      .bind(
        recoveryLeaseId,
        new Date(Date.now() + 30_000).toISOString(),
        now,
        subjectId,
        request.request_id,
        request.lease_id ?? '',
        request.lease_expires_at ?? '',
        now,
      )
      .first<{ request_id: string }>();
    if (!claimed) continue;

    await db.prepare(`UPDATE analysis_requests SET status = 'failed', reservation = NULL, usage_period = NULL,
      reservation_user_id = NULL, lease_id = NULL, lease_expires_at = NULL, updated_at = ?
      WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ?`)
      .bind(new Date().toISOString(), subjectId, request.request_id, recoveryLeaseId)
      .run();
  }
}
