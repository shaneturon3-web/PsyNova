import type { Env } from '../env';

export type TelehealthRoom = { url: string; mode: 'live' | 'mock'; provider: 'daily' | 'jitsi' };

/**
 * Phase 1.5 — Daily.co room provisioning with dual fallback (live → Jitsi public).
 */
export async function createTelehealthRoom(env: Env, sessionId: string): Promise<TelehealthRoom> {
  const apiKey = env.DAILY_API_KEY?.trim();
  if (apiKey) {
    try {
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `psynova-${sessionId}`.slice(0, 80),
          privacy: 'private',
          properties: { enable_prejoin_ui: true },
        }),
      });
      if (res.ok) {
        const json = (await res.json()) as { url?: string };
        if (json.url) {
          return { url: json.url, mode: 'live', provider: 'daily' };
        }
      }
    } catch {
      /* fall through */
    }
  }
  return {
    url: `https://meet.jit.si/psynova-${encodeURIComponent(sessionId)}`,
    mode: 'mock',
    provider: 'jitsi',
  };
}
