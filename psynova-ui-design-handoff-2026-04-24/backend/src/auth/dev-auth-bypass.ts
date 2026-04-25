import type { Request } from 'express';

/** Mirrors JwtAuthGuard-style bypass: dev env or explicit flag (no Passport in this project). */
export function isDevelopmentAuthBypass(): boolean {
  return (
    process.env.NODE_ENV === 'development' || process.env.DISABLE_AUTH === 'true'
  );
}

const DEV_MOCK_USER = {
  id: 'dev-user-123',
  email: 'dev@psynova.local',
  roles: ['admin', 'therapist'],
} as const;

export function createDevAuthPayload() {
  return {
    sub: DEV_MOCK_USER.id,
    email: DEV_MOCK_USER.email,
    role: 'admin' as const,
    preferredLanguage: 'en' as const,
    jti: 'dev-bypass',
    iat: 0,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

/** Populates `user` (and `authUser` payload shape) so controllers and services see a consistent principal. */
export function applyDevAuthBypassToRequest(
  request: Request & { user?: unknown; authUser?: unknown },
): void {
  request.user = { ...DEV_MOCK_USER };
  request.authUser = createDevAuthPayload();
}
