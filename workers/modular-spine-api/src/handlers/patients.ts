import type { Env } from '../env';

/** Phase 1.3 — D1-backed patient records (replaces static JSON mocks). */
export async function getPatientRecords(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
    return Response.json({ patients: results ?? [], source: 'd1' });
  } catch (err) {
    return Response.json(
      { error: 'd1_query_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
