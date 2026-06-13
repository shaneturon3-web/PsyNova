import type { Env } from '../env';
import { createTelehealthRoom } from '../utils/telehealth';

/** Phase 1.3 — Therapist availability / schedules from D1. */
export async function getTherapistAvailability(env: Env, therapistId?: string): Promise<Response> {
  try {
    const stmt = therapistId
      ? env.DB.prepare('SELECT * FROM schedules WHERE therapist_id = ? ORDER BY starts_at').bind(therapistId)
      : env.DB.prepare('SELECT * FROM schedules ORDER BY starts_at');
    const { results } = await stmt.all();
    return Response.json({ schedules: results ?? [], source: 'd1' });
  } catch (err) {
    return Response.json(
      { error: 'd1_query_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

/** Phase 1.5 — Confirm appointment → provision Daily.co room → persist URL. */
export async function confirmAppointment(env: Env, scheduleId: string): Promise<Response> {
  try {
    const row = await env.DB.prepare('SELECT * FROM schedules WHERE id = ?')
      .bind(scheduleId)
      .first<{ id: string; appointment_status: string }>();
    if (!row) return Response.json({ error: 'not_found' }, { status: 404 });

    const room = await createTelehealthRoom(env, scheduleId);
    await env.DB.prepare(
      `UPDATE schedules SET appointment_status = 'Confirmed', telehealth_url = ? WHERE id = ?`,
    )
      .bind(room.url, scheduleId)
      .run();

    return Response.json({ scheduleId, status: 'Confirmed', telehealth: room });
  } catch (err) {
    return Response.json(
      { error: 'confirm_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
