import type { Env } from '../env';

/**
 * Phase 1.1 — Active R2 binary stream (PUT/GET). Replaces metadata-only placeholders.
 */
export async function handleStorageRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const key = parts[parts.length - 1];
  if (!key || key === 'storage') {
    return new Response('Missing asset key', { status: 400 });
  }

  if (request.method === 'PUT') {
    await env.R2_BUCKET.put(key, request.body, {
      httpMetadata: {
        contentType: request.headers.get('Content-Type') || 'application/octet-stream',
      },
    });
    return new Response(`Put ${key} successfully!`, { status: 201 });
  }

  if (request.method === 'GET') {
    const object = await env.R2_BUCKET.get(key);
    if (!object) return new Response('Object Not Found', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    return new Response(object.body, { headers });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
