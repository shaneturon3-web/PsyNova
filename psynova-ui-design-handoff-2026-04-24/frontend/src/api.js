// Default `/api` = same origin as Vite dev/preview; vite.config.js proxies to Nest :3000.
// Override at build time: VITE_API_BASE=http://localhost:3000/api
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('psynova_access_token');
}

function setToken(t) {
  if (t) localStorage.setItem('psynova_access_token', t);
  else localStorage.removeItem('psynova_access_token');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token && options.auth !== false) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (e) {
    const hint = API_BASE.startsWith('/') ? ' — is the API running on :3000? (Vite proxies /api there.)' : '';
    throw new Error((e instanceof Error ? e.message : String(e)) + hint);
  }
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

export async function health() {
  return request('/health', { auth: false });
}

export async function register(body) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(body), auth: false });
}

export async function login(body) {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false });
  if (data?.accessToken) setToken(data.accessToken);
  return data;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    setToken(null);
  }
}

export async function me() {
  return request('/auth/me');
}

export async function listAppointments(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/appointments${q ? `?${q}` : ''}`);
}

export async function createAppointment(body) {
  return request('/appointments', { method: 'POST', body: JSON.stringify(body) });
}

/** @param {{ name: string; email: string; message: string; clientLanguage?: string }} body */
export async function submitContact(body) {
  return request('/forms/contact', { method: 'POST', body: JSON.stringify(body), auth: false });
}

/** Optional preview — same translation pipeline as server-side storage. */
export async function translateText(text, sourceLang) {
  return request('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, sourceLang }),
    auth: false,
  });
}

export { getToken, setToken, API_BASE };
