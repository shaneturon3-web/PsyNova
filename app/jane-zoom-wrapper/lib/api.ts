const API = process.env.NEXT_PUBLIC_API_BASE || '/api';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getSchedule() {
  try {
    return { ...(await fetchJson<{ date: string; appointments: unknown[] }>('/jane/schedule')), source: 'live' as const };
  } catch {
    const now = new Date();
    return {
      source: 'mock' as const,
      date: now.toISOString().slice(0, 10),
      appointments: [
        { id: 'mock-1', patientLabel: 'Patient A.M.', startAt: now.toISOString(), joinUrl: 'https://meet.jit.si/psynova-mock-1', mode: 'mock' },
      ],
    };
  }
}

export type SyncJaneResult = { imported?: number; source?: string; appointments?: unknown[]; error?: string };

export async function syncJane(): Promise<SyncJaneResult> {
  try {
    return await fetchJson<SyncJaneResult>('/jane/sync', { method: 'POST', body: '{}' });
  } catch (e) {
    return { imported: 0, source: 'mock', error: String(e) };
  }
}

export async function createMeeting(patientName: string, startTime: string) {
  try {
    return await fetchJson<{ joinUrl: string; signature?: string; mode: string }>('/zoom/create-meeting', {
      method: 'POST',
      body: JSON.stringify({ patientName, startTime }),
    });
  } catch {
    return {
      joinUrl: `https://meet.jit.si/psynova-${encodeURIComponent(patientName)}`,
      signature: 'mock',
      mode: 'mock',
    };
  }
}
