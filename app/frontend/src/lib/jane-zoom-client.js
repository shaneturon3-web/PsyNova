/**
 * Jane + Zoom wrapper API — dual fallback (live Nest → local mock), same pattern as backup-video.
 */
import {
  createBackupVideoSession,
  getSessionProviders,
} from '../api.js';

const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

async function janeRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

function mockTodaySchedule() {
  const now = new Date();
  const t1 = new Date(now);
  t1.setHours(9, 0, 0, 0);
  const t2 = new Date(now);
  t2.setHours(11, 0, 0, 0);
  return {
    date: now.toISOString().slice(0, 10),
    source: 'mock',
    appointments: [
      {
        id: 'jane-mock-am',
        patientLabel: 'Patient A.M. (local fallback)',
        startAt: t1.toISOString(),
        joinUrl: `https://meet.jit.si/psynova-jane-mock-am`,
        mode: 'mock',
        notice: 'Backend unreachable — Jitsi public room fallback.',
      },
      {
        id: 'jane-mock-pm',
        patientLabel: 'Patient B.K. (local fallback)',
        startAt: t2.toISOString(),
        joinUrl: `https://meet.jit.si/psynova-jane-mock-pm`,
        mode: 'mock',
      },
    ],
    tag: 'MOCKUP-PURPOSE-ONLY',
  };
}

export async function fetchJaneSchedule() {
  try {
    return { ...(await janeRequest('/jane/schedule')), source: 'live' };
  } catch (e) {
    return { ...mockTodaySchedule(), error: e?.message || String(e) };
  }
}

export async function syncJaneFeed(feedUrl) {
  try {
    return await janeRequest('/jane/sync', {
      method: 'POST',
      body: JSON.stringify(feedUrl ? { feedUrl } : {}),
    });
  } catch (e) {
    return { ...mockTodaySchedule(), imported: 2, source: 'mock', syncError: e?.message };
  }
}

export async function fetchZoomToken() {
  try {
    return await janeRequest('/zoom/token');
  } catch {
    return { accessToken: 'mock', mode: 'mock', expiresIn: 3600, tag: 'MOCKUP-PURPOSE-ONLY' };
  }
}

export async function createJaneMeeting(patientName, startTime, appointmentId) {
  try {
    return await janeRequest('/zoom/create-meeting', {
      method: 'POST',
      body: JSON.stringify({ patientName, startTime, appointmentId }),
    });
  } catch (e) {
    const sessionId = appointmentId || `jane-fallback-${Date.now()}`;
    const res = await createBackupVideoSession({ sessionId, provider: 'zoom' }).catch(() => ({
      joinUrl: `https://meet.jit.si/${encodeURIComponent(sessionId)}`,
      mode: 'mock',
      notice: 'Zoom API unavailable',
    }));
    return {
      appointmentId: sessionId,
      joinUrl: res.joinUrl,
      mode: res.mode,
      notice: res.notice || e?.message,
      signature: 'mock-signature',
      tag: 'MOCKUP-PURPOSE-ONLY',
    };
  }
}

/** Start session: primary Zoom join URL, fallback backup-video then Jitsi. */
export async function launchJaneSession(appointment) {
  const id = appointment?.id || `jane-${Date.now()}`;
  if (appointment?.joinUrl) {
    return { joinUrl: appointment.joinUrl, mode: appointment.mode || 'live', source: 'appointment' };
  }
  try {
    const created = await createJaneMeeting(appointment?.patientLabel || 'Patient', appointment?.startAt || new Date().toISOString(), id);
    return { joinUrl: created.joinUrl, mode: created.mode, source: 'create-meeting', notice: created.notice };
  } catch {
    const providers = await getSessionProviders().catch(() => null);
    const useJitsi = providers?.backup?.jitsi?.configured;
    if (useJitsi) {
      return { joinUrl: `https://meet.jit.si/psynova-${encodeURIComponent(id)}`, mode: 'live', source: 'jitsi-fallback' };
    }
    const backup = await createBackupVideoSession({ sessionId: id });
    return { joinUrl: backup.joinUrl, mode: backup.mode, source: 'backup-video', notice: backup.notice };
  }
}
