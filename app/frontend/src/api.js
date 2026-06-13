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

/**
 * Backend video-provider readiness summary. Reads BACKEND env (no VITE_* leakage).
 * Returns shape from `SessionsService.getProviders()`.
 */
export async function getSessionProviders() {
  return request('/sessions/providers', { auth: false });
}

/**
 * Mint a backup video join URL via the backend stub seam.
 * @param {{ sessionId: string, provider?: 'zoom'|'daily'|'whereby'|'jitsi' }} body
 * Returns `{ sessionId, provider, joinUrl, mode, notice?, tag }`.
 */
export async function createBackupVideoSession(body) {
  return request('/sessions/backup-video', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: false,
  });
}

/**
 * Mint a phone fallback (PSTN) instruction via the backend.
 * @param {{ sessionId: string, provider?: 'twilio'|'telnyx'|'vonage', toNumber?: string }} body
 * Returns `{ sessionId, provider, phoneNumber, conferenceCode, mode, notice?, tag }`.
 */
export async function createPhoneFallback(body) {
  return request('/sessions/phone-fallback', {
    method: 'POST',
    body: JSON.stringify(body),
    auth: false,
  });
}

/**
 * Compose the unified telehealth launch payload (video + chat + notes + checklist).
 * @param {string} sessionId
 */
export async function getTelehealthLaunch(sessionId) {
  return request(`/telehealth/sessions/${encodeURIComponent(sessionId)}/launch`, {
    auth: false,
  });
}

/**
 * Transition an appointment to a new status. Optional `reason` is appended to the
 * internal FR note when status is `cancelled`.
 * @param {string} id
 * @param {{ status: 'pending'|'confirmed'|'cancelled'|'completed', reason?: string }} body
 */
export async function updateAppointmentStatus(id, body) {
  return request(`/appointments/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Fetch the dev-only seeded test accounts (with plaintext passwords) for the
 * #/app/test-accounts one-click sign-in page. Returns 404 in production — caller
 * should treat that as "Test accounts page disabled".
 */
export async function getTestAccounts() {
  return request('/dev/test-accounts', { auth: false });
}

// ============================================================================
// Billing
// ============================================================================
export async function listInvoices(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/billing/invoices${q ? `?${q}` : ''}`);
}
export async function createInvoice(body) {
  return request('/billing/invoices', { method: 'POST', body: JSON.stringify(body) });
}
export async function getInvoice(id) {
  return request(`/billing/invoices/${encodeURIComponent(id)}`);
}
export async function addInvoicePayment(id, body) {
  return request(`/billing/invoices/${encodeURIComponent(id)}/payments`, { method: 'POST', body: JSON.stringify(body) });
}
export async function createCheckoutSession(id, body = {}) {
  return request(`/billing/invoices/${encodeURIComponent(id)}/checkout-session`, { method: 'POST', body: JSON.stringify(body) });
}
export function invoiceReceiptUrl(id) {
  return `${API_BASE}/billing/invoices/${encodeURIComponent(id)}/receipt.pdf`;
}
export async function listClaims(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/billing/claims${q ? `?${q}` : ''}`);
}
export async function createClaim(invoiceId, body) {
  return request(`/billing/invoices/${encodeURIComponent(invoiceId)}/claims`, { method: 'POST', body: JSON.stringify(body) });
}
export async function getClaim(id) {
  return request(`/billing/claims/${encodeURIComponent(id)}`);
}
export async function quoteService(serviceCode, annualIncomeCents) {
  const q = new URLSearchParams({ serviceCode, ...(annualIncomeCents != null ? { annualIncomeCents: String(annualIncomeCents) } : {}) }).toString();
  return request(`/billing/quote?${q}`);
}

// ============================================================================
// Clinical records
// ============================================================================
export async function getPatientChart(patientId) {
  return request(`/clinical/patients/${encodeURIComponent(patientId)}/chart`);
}
export async function listNotes(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/clinical/notes${q ? `?${q}` : ''}`);
}
export async function getNote(id) {
  return request(`/clinical/notes/${encodeURIComponent(id)}`);
}
export async function createNote(body) {
  return request('/clinical/notes', { method: 'POST', body: JSON.stringify(body) });
}
export async function updateNote(id, body) {
  return request(`/clinical/notes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
}
export async function signNote(id) {
  return request(`/clinical/notes/${encodeURIComponent(id)}/sign`, { method: 'POST' });
}
export async function listConsents(patientId) {
  return request(`/clinical/consents?patientId=${encodeURIComponent(patientId)}`);
}
export async function createConsent(body) {
  return request('/clinical/consents', { method: 'POST', body: JSON.stringify(body) });
}
export async function uploadAttachment(file, patientId, noteId) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('patientId', patientId);
  if (noteId) fd.append('noteId', noteId);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/clinical/attachments`, { method: 'POST', headers, body: fd });
  if (!res.ok) {
    const err = new Error(`Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
export async function listAuditEvents(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/clinical/audit${q ? `?${q}` : ''}`);
}
export async function verifyAuditChain() {
  return request('/clinical/audit/verify');
}

// ============================================================================
// Clinician workspace
// ============================================================================
export async function getClinicianDashboard() {
  return request('/clinician/me/dashboard');
}
export async function listAvailability(clinicianId) {
  return request(`/clinician/availability?clinicianId=${encodeURIComponent(clinicianId)}`);
}
export async function createAvailability(body) {
  return request('/clinician/availability', { method: 'POST', body: JSON.stringify(body) });
}
export async function deleteAvailability(id) {
  return request(`/clinician/availability/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function listTreatmentPlans(patientId) {
  return request(`/clinician/treatment-plans?patientId=${encodeURIComponent(patientId)}`);
}
export async function createTreatmentPlan(body) {
  return request('/clinician/treatment-plans', { method: 'POST', body: JSON.stringify(body) });
}
export async function listMessageThreads() {
  return request('/clinician/messages/threads');
}
export async function getMessageThread(id) {
  return request(`/clinician/messages/threads/${encodeURIComponent(id)}`);
}
export async function createMessageThread(body) {
  return request('/clinician/messages/threads', { method: 'POST', body: JSON.stringify(body) });
}
export async function postMessage(threadId, body) {
  return request(`/clinician/messages/threads/${encodeURIComponent(threadId)}/posts`, { method: 'POST', body: JSON.stringify(body) });
}
export async function listCdsAlerts(query = {}) {
  const q = new URLSearchParams(query).toString();
  return request(`/clinician/cds/alerts${q ? `?${q}` : ''}`);
}
export async function resolveCdsAlert(id) {
  return request(`/clinician/cds/alerts/${encodeURIComponent(id)}/resolve`, { method: 'PATCH' });
}

// ============================================================================
// Simulator (dev only — endpoints return 404 in production)
// ============================================================================
export async function simStatus() { return request('/sim/status', { auth: false }); }
export async function simStripeWebhook(invoiceId) {
  return request('/sim/billing/stripe-webhook', { method: 'POST', body: JSON.stringify({ invoiceId }), auth: false });
}
export async function simAdjudicateClaim(claimId, outcome, reason) {
  return request('/sim/billing/ramq-adjudicate', { method: 'POST', body: JSON.stringify({ claimId, outcome, reason }), auth: false });
}
export async function simAuditTamper() {
  return request('/sim/clinical/audit-tamper-attempt', { method: 'POST', auth: false });
}
export async function simUploadMockAttachment(patientId) {
  return request('/sim/clinical/upload-mock-attachment', { method: 'POST', body: JSON.stringify({ patientId }), auth: false });
}
export async function simSeedCaseload(clinicianId, patientId) {
  return request('/sim/workspace/seed-caseload', { method: 'POST', body: JSON.stringify({ clinicianId, patientId }), auth: false });
}

export { getToken, setToken, API_BASE };
