// [MOCKUP PURPOSE ONLY - NOT REAL DATA]
// Clinician Workspace view: today + upcoming caseload, unread message threads,
// open invoices, CDS alerts, availability blocks, treatment plans, compose message.
// Replaces the prior "Not implemented" gray view at #/app/clinician.

import {
  getClinicianDashboard,
  listAvailability,
  createAvailability,
  deleteAvailability,
  listTreatmentPlans,
  createTreatmentPlan,
  listMessageThreads,
  createMessageThread,
  postMessage,
  getMessageThread,
  listCdsAlerts,
  resolveCdsAlert,
  simSeedCaseload,
} from '../api.js';

const PATIENT_DEMO = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CLINICIAN_DEMO = '00000000-0000-4000-8000-000000000001';

const state = {
  dashboard: null,
  availability: [],
  plans: [],
  threads: [],
  alerts: [],
  openThread: null,
  banner: null,
  error: null,
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

export async function refreshWorkspace(opts = {}) {
  try {
    const [dash, avail, plans, threads, alerts] = await Promise.all([
      getClinicianDashboard(),
      listAvailability(opts.clinicianId || CLINICIAN_DEMO),
      listTreatmentPlans(opts.patientId || PATIENT_DEMO),
      listMessageThreads(),
      listCdsAlerts({}),
    ]);
    state.dashboard = dash;
    state.availability = avail.items || [];
    state.plans = plans.items || [];
    state.threads = threads.items || [];
    state.alerts = alerts.items || [];
    state.error = null;
  } catch (e) {
    state.error = e.body?.message || e.message;
  }
}

export function viewClinicianWorkspace() {
  const banner = state.banner ? `<div class="banner banner--success">${esc(state.banner)}</div>` : '';
  const err = state.error ? `<div class="banner banner--error">${esc(state.error)}</div>` : '';
  const d = state.dashboard;
  const today = (d?.today || []).map((a) => `<li><strong>${esc(new Date(a.starts_at).toLocaleTimeString())}</strong> &middot; <code>${esc((a.patient_id || '').slice(0, 8))}</code> &middot; ${esc(a.status)}</li>`).join('');
  const upcoming = (d?.upcoming || []).slice(0, 5).map((a) => `<li>${esc(new Date(a.starts_at).toLocaleString())} &middot; ${esc(a.status)}</li>`).join('');
  const openInv = (d?.openInvoices || []).map((i) => `<li><code>${esc(i.id.slice(0, 8))}</code> &middot; ${(Number(i.totalCents) / 100).toFixed(2)} ${esc(i.currency)} &middot; ${esc(i.status)}</li>`).join('');
  const alertList = state.alerts.map((a) => `
    <li>
      <span class="status status--${esc(a.severity)}">${esc(a.severity)}</span>
      ${esc(a.message)}
      <button class="btn btn--xs btn--ghost" data-alert-resolve="${esc(a.id)}">Resolve</button>
    </li>`).join('');
  const availList = state.availability.map((a) => `
    <li>
      ${a.block_type === 'recurring'
        ? `weekly mask=${esc(a.weekday_mask)} ${esc(a.start_time)}–${esc(a.end_time)}`
        : `${esc(new Date(a.startsAt).toLocaleString())} → ${esc(new Date(a.endsAt).toLocaleTimeString())}`}
      <span class="muted">(${esc(a.kind)})</span>
      <button class="btn btn--xs btn--ghost" data-availability-delete="${esc(a.id)}">Delete</button>
    </li>`).join('');
  const planList = state.plans.map((p) => `
    <li>
      <strong>${esc(p.title)}</strong> &middot; ${esc(p.status)} &middot; ${esc(p.diagnosis || 'no dx')}
      <ul class="bullets">${(p.goals || []).map((g) => `<li>${esc(g.description)} <em>(${esc(g.status)})</em></li>`).join('')}</ul>
    </li>`).join('');

  const threadList = state.threads.map((t) => `
    <li>
      <a href="#" data-thread-open="${esc(t.id)}">${esc(t.subject || `Thread ${t.id.slice(0, 8)}`)}</a>
      ${t.unreadCount > 0 ? `<span class="status status--warning">${esc(t.unreadCount)} unread</span>` : ''}
      <span class="muted">${t.lastPostAt ? esc(new Date(t.lastPostAt).toLocaleString()) : ''}</span>
    </li>`).join('');
  const openThread = state.openThread ? `
    <div class="card">
      <h3>Thread: ${esc(state.openThread.thread.subject || state.openThread.thread.id)}</h3>
      <ul class="msg-list">
        ${state.openThread.messages.map((m) => `<li><strong>${esc((m.senderId || '').slice(0,8))}</strong>: ${esc(m.body)} <span class="muted">${esc(new Date(m.createdAt).toLocaleString())}</span></li>`).join('')}
      </ul>
      <form id="form-thread-post" class="form-inline">
        <input name="body" placeholder="Reply…" required />
        <button class="btn">Send</button>
      </form>
    </div>` : '';

  return `
    <section class="app-shell">
      <header class="app-shell__header">
        <h1>Clinician workspace <small class="tag">[DRAFT]</small></h1>
        <p class="muted">Today's caseload, alerts, availability, treatment plans, secure messages. <a href="#/app">&larr; Dashboard</a></p>
      </header>
      ${banner}${err}

      <div class="grid four-up">
        <div class="card">
          <h3>Today</h3>
          ${today ? `<ul class="bullets">${today}</ul>` : '<p class="muted">No appointments today.</p>'}
        </div>
        <div class="card">
          <h3>Upcoming</h3>
          ${upcoming ? `<ul class="bullets">${upcoming}</ul>` : '<p class="muted">Nothing scheduled.</p>'}
        </div>
        <div class="card">
          <h3>Open invoices</h3>
          ${openInv ? `<ul class="bullets">${openInv}</ul>` : '<p class="muted">None outstanding.</p>'}
        </div>
        <div class="card">
          <h3>CDS alerts</h3>
          ${alertList ? `<ul class="bullets">${alertList}</ul>` : '<p class="muted">All clear.</p>'}
        </div>
      </div>

      <div class="grid two-up">
        <div class="card">
          <h2>Availability</h2>
          <ul class="bullets">${availList || '<li class="muted">No blocks defined.</li>'}</ul>
          <form id="form-new-availability" class="form-inline">
            <input name="startsAt" type="datetime-local" required />
            <input name="endsAt" type="datetime-local" required />
            <button class="btn">Add one-off block</button>
          </form>
        </div>
        <div class="card">
          <h2>Treatment plan</h2>
          <ul class="bullets">${planList || '<li class="muted">No plans for demo patient.</li>'}</ul>
          <form id="form-new-plan" class="form-inline">
            <input name="title" placeholder="Plan title" required />
            <input name="diagnosis" placeholder="Diagnosis (optional)" />
            <button class="btn">Add plan with 2 goals</button>
          </form>
        </div>
      </div>

      <div class="card">
        <h2>Secure messages</h2>
        <ul class="bullets">${threadList || '<li class="muted">No threads yet.</li>'}</ul>
        <form id="form-new-thread" class="form-inline">
          <input name="subject" placeholder="Subject" />
          <input name="initialMessage" placeholder="First message" required />
          <button class="btn">Start thread with demo patient</button>
        </form>
        ${openThread}
      </div>

      <div class="card">
        <h2>Simulator</h2>
        <button class="btn btn--xs" id="btn-sim-seed-caseload">Seed extra caseload (sim)</button>
      </div>
    </section>`;
}

export function bindWorkspace(render) {
  document.getElementById('form-new-availability')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await createAvailability({
        clinicianId: CLINICIAN_DEMO, blockType: 'one_off',
        startsAt: new Date(String(fd.get('startsAt'))).toISOString(),
        endsAt: new Date(String(fd.get('endsAt'))).toISOString(),
      });
      state.banner = 'Availability block added.'; await refreshWorkspace(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.querySelectorAll('[data-availability-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-availability-delete');
      try { await deleteAvailability(id); state.banner = 'Block deleted.'; await refreshWorkspace(); render(); }
      catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
  document.getElementById('form-new-plan')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await createTreatmentPlan({
        patientId: PATIENT_DEMO, clinicianId: CLINICIAN_DEMO,
        title: String(fd.get('title')),
        diagnosis: String(fd.get('diagnosis') || '') || undefined,
        goals: [
          { description: 'Reduce PHQ-9 by 5 points', status: 'in_progress' },
          { description: 'Practice grounding daily', status: 'in_progress' },
        ],
      });
      state.banner = 'Treatment plan created.'; await refreshWorkspace(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.getElementById('form-new-thread')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await createMessageThread({
        patientId: PATIENT_DEMO, clinicianId: CLINICIAN_DEMO,
        subject: String(fd.get('subject') || '').trim() || undefined,
        initialMessage: String(fd.get('initialMessage') || ''),
      });
      state.banner = 'Thread created.'; await refreshWorkspace(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.querySelectorAll('[data-thread-open]').forEach((a) => {
    a.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const id = a.getAttribute('data-thread-open');
      try { state.openThread = await getMessageThread(id); render(); }
      catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
  document.getElementById('form-thread-post')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!state.openThread) return;
    try {
      await postMessage(state.openThread.thread.id, { body: String(fd.get('body') || '') });
      state.openThread = await getMessageThread(state.openThread.thread.id);
      render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.querySelectorAll('[data-alert-resolve]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-alert-resolve');
      try { await resolveCdsAlert(id); state.banner = 'Alert resolved.'; await refreshWorkspace(); render(); }
      catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
  document.getElementById('btn-sim-seed-caseload')?.addEventListener('click', async () => {
    try {
      await simSeedCaseload(CLINICIAN_DEMO, PATIENT_DEMO);
      state.banner = 'Seeded extra caseload.'; await refreshWorkspace(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
}
