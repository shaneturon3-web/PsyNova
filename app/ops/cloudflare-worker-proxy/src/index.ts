// PsyNova reverse-proxy Worker.
//
// Forwards every incoming request to env.ORIGIN_URL while preserving method,
// path, query, headers and body. The Host header is dropped so fetch() can
// derive it from the target URL — required because the upstream cloudflared
// edge uses SNI to route the request to the right tunnel.
//
// Known limitations (documented in app/CLOUDFLARE_WORKER_PROXY.md):
//   - No WebSocket pass-through. Vite HMR will fail to connect over the proxy
//     but the page itself renders fine; testers can hard-refresh after edits.

export interface Env {
  ORIGIN_URL: string;
}

const PLACEHOLDER_HOSTS = new Set(['placeholder.invalid', '']);

// Hop-by-hop headers (RFC 7230 §6.1) that must NOT be forwarded.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function placeholderResponse(reason: string): Response {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>PsyNova staging — origin offline</title></head>
<body style="font-family:system-ui;max-width:640px;margin:4rem auto;padding:0 1rem;color:#111;">
  <h1 style="margin:0 0 .5rem;">PsyNova staging</h1>
  <p style="color:#555;margin:0 0 1.5rem;">${reason}</p>
  <p>Wait for the local stack + cloudflared tunnel to come back online,
     then refresh. The tunnel URL is refreshed automatically on every restart.</p>
</body></html>`;
  return new Response(html, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-psynova-proxy': 'placeholder',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = (env.ORIGIN_URL ?? '').trim();
    if (!origin || PLACEHOLDER_HOSTS.has(new URL(origin).hostname)) {
      return placeholderResponse(
        'No tunnel is currently registered with this proxy.',
      );
    }

    const incoming = new URL(request.url);
    const target = new URL(origin);
    target.pathname = incoming.pathname;
    target.search = incoming.search;

    // Build the outbound request. Drop Host + hop-by-hop headers; fetch() will
    // set Host from target.hostname automatically.
    const headers = new Headers();
    for (const [key, value] of request.headers) {
      const k = key.toLowerCase();
      if (k === 'host' || HOP_BY_HOP.has(k)) continue;
      headers.set(key, value);
    }

    // Pass the client IP through so backend logs aren't all "Cloudflare".
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) {
      const xff = request.headers.get('x-forwarded-for');
      headers.set('x-forwarded-for', xff ? `${xff}, ${cfIp}` : cfIp);
    }
    headers.set('x-forwarded-proto', incoming.protocol.replace(':', ''));
    headers.set('x-forwarded-host', incoming.host);

    let outbound: Request;
    try {
      outbound = new Request(target.toString(), {
        method: request.method,
        headers,
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? null
            : request.body,
        redirect: 'manual',
      });
    } catch (err) {
      return new Response(
        `proxy: failed to construct upstream request: ${(err as Error).message}`,
        { status: 502, headers: { 'content-type': 'text/plain' } },
      );
    }

    let upstream: Response;
    try {
      upstream = await fetch(outbound);
    } catch (err) {
      return placeholderResponse(
        `Origin unreachable (${(err as Error).message}). The tunnel may have just restarted.`,
      );
    }

    const respHeaders = new Headers(upstream.headers);
    respHeaders.delete('content-security-policy');
    respHeaders.set('x-psynova-proxy', 'workers-dev');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};
