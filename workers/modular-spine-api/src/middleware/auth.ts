import type { Env } from '../env';

const PROTECTED_PREFIXES = ['/admin/', '/professional/'];

/**
 * Phase 1.2 — Cloudflare Access perimeter.
 * Production: requires Cf-Access-Jwt-Assertion when PERIMETER_LOCK=true.
 * Full JWKS verification: wire CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD (pending cert fetch).
 */
export async function enforceAccessPerimeter(
  request: Request,
  env: Env,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    return null;
  }

  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) {
    return json401('Missing Cf-Access-Jwt-Assertion');
  }

  if (env.PERIMETER_LOCK !== 'true') {
    return null;
  }

  const verified = await verifyAccessJwtStub(jwt, env);
  if (!verified) {
    return json401('Invalid or unverified Access JWT');
  }

  return null;
}

async function verifyAccessJwtStub(token: string, env: Env): Promise<boolean> {
  if (!token || token.split('.').length !== 3) return false;
  if (!env.CF_ACCESS_TEAM_DOMAIN && !env.CF_ACCESS_AUD) {
    return true;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (env.CF_ACCESS_AUD && payload.aud !== env.CF_ACCESS_AUD) return false;
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function json401(message: string): Response {
  return Response.json(
    { error: 'Unauthorized', message, footer: 'Clinical judgment always remains with the licensed professional.' },
    { status: 401 },
  );
}
