import type { Env } from '../env';

/**
 * Phase 1.4 — Stripe webhook → D1 billing_recovery (signature verify when secret set).
 */
export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  if (env.STRIPE_WEBHOOK_SECRET && sig) {
    const ok = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!ok) {
      return new Response('Webhook Error: invalid signature', { status: 400 });
    }
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(body) as typeof event;
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data?.object ?? {};
      const id = String(intent.id ?? '');
      await env.DB.prepare(
        `UPDATE billing_recovery SET payment_status = 'succeeded', last_attempt = datetime('now') WHERE stripe_session_id = ?`,
      )
        .bind(id)
        .run();
    }
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data?.object ?? {};
      const sub = String(invoice.subscription ?? invoice.id ?? '');
      await env.DB.prepare(
        `UPDATE billing_recovery SET retry_count = retry_count + 1, payment_status = 'failed', last_attempt = datetime('now') WHERE stripe_session_id = ?`,
      )
        .bind(sub)
        .run();
    }
  } catch (err) {
    return Response.json(
      { error: 'd1_mutation_failed', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  return new Response(null, { status: 200 });
}

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    }),
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === v1;
}
