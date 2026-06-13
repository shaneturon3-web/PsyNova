import type { Env } from '../env';

type Probe = { name: string; ok: boolean; detail?: string };

/**
 * Phase 2.1 — Deterministic health: D1 + R2 + Stripe probes in one try/catch envelope.
 */
export async function handleHealth(env: Env): Promise<Response> {
  const probes: Probe[] = [];
  let allOk = true;

  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    probes.push({ name: 'd1', ok: true });
  } catch (err) {
    allOk = false;
    probes.push({ name: 'd1', ok: false, detail: (err as Error).message });
  }

  try {
    const listed = await env.R2_BUCKET.list({ limit: 1 });
    probes.push({ name: 'r2', ok: true, detail: `objects=${listed.objects.length}` });
  } catch (err) {
    allOk = false;
    probes.push({ name: 'r2', ok: false, detail: (err as Error).message });
  }

  try {
    if (!env.STRIPE_SECRET?.trim()) {
      probes.push({ name: 'stripe', ok: true, detail: 'skipped_no_secret' });
    } else {
      const res = await fetch('https://api.stripe.com/v1/balance', {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET}` },
      });
      probes.push({ name: 'stripe', ok: res.ok, detail: `http_${res.status}` });
      if (!res.ok) allOk = false;
    }
  } catch (err) {
    allOk = false;
    probes.push({ name: 'stripe', ok: false, detail: (err as Error).message });
  }

  const payload = {
    service: 'modular-spine-api',
    status: allOk ? 'healthy' : 'degraded',
    metric: '6 hours per week billable recovery (canonical)',
    probes,
    timestamp: new Date().toISOString(),
  };

  return Response.json(payload, { status: allOk ? 200 : 503 });
}
