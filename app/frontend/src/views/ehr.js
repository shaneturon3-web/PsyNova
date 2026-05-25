// [MOCKUP PURPOSE ONLY - NOT REAL DATA]
// Clinical Records view: chart browser, SOAP note editor, sign/lock, attachments,
// audit log + chain verifier + tamper sim. Replaces the prior "Not implemented"
// gray view at #/app/ehr.

import {
  getPatientChart,
  listNotes,
  createNote,
  signNote,
  uploadAttachment,
  listAuditEvents,
  verifyAuditChain,
  simAuditTamper,
  simUploadMockAttachment,
  createConsent,
} from '../api.js';

const PATIENT_DEMO = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CLINICIAN_DEMO = '00000000-0000-4000-8000-000000000001';

const state = {
  chart: null,
  notes: [],
  audit: [],
  verify: null,
  banner: null,
  error: null,
  patientId: PATIENT_DEMO,
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

export async function refreshEhr() {
  try {
    const [chart, notes, audit] = await Promise.all([
      getPatientChart(state.patientId),
      listNotes({ patientId: state.patientId }),
      listAuditEvents({}),
    ]);
    state.chart = chart;
    state.notes = notes.items || [];
    state.audit = (audit.items || []).slice(0, 20);
    state.error = null;
  } catch (e) {
    state.error = e.body?.message || e.message;
  }
}

export function viewEhr() {
  const c = state.chart;
  const banner = state.banner ? `<div class="banner banner--success">${esc(state.banner)}</div>` : '';
  const err = state.error ? `<div class="banner banner--error">${esc(state.error)}</div>` : '';
  const verify = state.verify
    ? `<span class="status status--${state.verify.ok ? 'paid' : 'rejected'}">Chain ${state.verify.ok ? 'intact' : 'BROKEN'} (${state.verify.total} events)</span>`
    : '<span class="muted">(not verified)</span>';

  const noteRows = state.notes.map((n) => `
    <tr>
      <td>${esc(n.noteType)}</td>
      <td>${esc(n.title || (n.subjective || n.body || '').slice(0, 60))}</td>
      <td>${esc(new Date(n.createdAt).toLocaleString())}</td>
      <td>${n.signedAt ? `<span class="status status--paid">signed</span>` : '<span class="status status--draft">draft</span>'}</td>
      <td class="actions">
        ${!n.signedAt ? `<button class="btn btn--xs" data-note-sign="${esc(n.id)}">Sign</button>` : `<code title="${esc(n.signatureHash)}">${esc((n.signatureHash || '').slice(0, 12))}…</code>`}
      </td>
    </tr>`).join('');

  const consents = (c?.consents || []).map((cons) => `
    <li>${esc(cons.consent_type)} <code>${esc(cons.consent_version)}</code> &middot;
        ${cons.accepted ? '<span class="status status--paid">accepted</span>' : '<span class="status status--rejected">refused</span>'}
        &middot; ${esc(new Date(cons.accepted_at).toLocaleString())}</li>`).join('');
  const attachments = (c?.attachments || []).map((a) => `
    <li><a href="/api/clinical/attachments/${esc(a.id)}" target="_blank" rel="noopener">${esc(a.filename)}</a>
        <span class="muted">(${esc(a.mime_type)}, ${(Number(a.byte_size)/1024).toFixed(1)} KB)</span></li>`).join('');

  const auditRows = state.audit.map((a) => `
    <tr>
      <td>${esc(new Date(a.created_at).toLocaleString())}</td>
      <td>${esc(a.actor_id ? a.actor_id.slice(0, 8) : '—')}</td>
      <td>${esc(a.entity_type)}</td>
      <td>${esc(a.action)}</td>
      <td><code title="${esc(a.current_hash)}">${esc(String(a.current_hash || '').slice(0, 16))}…</code></td>
    </tr>`).join('');

  return `
    <section class="app-shell">
      <header class="app-shell__header">
        <h1>Clinical records (EHR) <small class="tag">[DRAFT]</small></h1>
        <p class="muted">Chart, SOAP/progress notes, consents, attachments, signed audit log. <a href="#/app">&larr; Dashboard</a></p>
      </header>
      ${banner}${err}

      <div class="card">
        <h2>Patient chart</h2>
        <p class="muted">Patient ID: <code>${esc(state.patientId)}</code></p>
        <div class="grid two-up">
          <div>
            <h3>Consents</h3>
            ${consents ? `<ul class="bullets">${consents}</ul>` : '<p class="muted">None recorded.</p>'}
            <button class="btn btn--xs" id="btn-record-consent">Record Telehealth consent v1</button>
          </div>
          <div>
            <h3>Attachments</h3>
            ${attachments ? `<ul class="bullets">${attachments}</ul>` : '<p class="muted">None.</p>'}
            <div class="actions">
              <input type="file" id="ehr-attachment-file" />
              <button class="btn btn--xs" id="btn-upload-attachment">Upload</button>
              <button class="btn btn--xs btn--ghost" id="btn-sim-attachment">Sim drop sample</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>SOAP note</h2>
        <form id="form-new-note" class="form-stack">
          <label>Subjective <textarea name="subjective" rows="2"></textarea></label>
          <label>Objective <textarea name="objective" rows="2"></textarea></label>
          <label>Assessment <textarea name="assessment" rows="2"></textarea></label>
          <label>Plan <textarea name="plan" rows="2"></textarea></label>
          <button type="submit" class="btn">Save SOAP note</button>
        </form>
      </div>

      <div class="card">
        <h2>Notes</h2>
        ${noteRows ? `<div class="table-wrap"><table class="data-table"><thead>
          <tr><th>Type</th><th>Preview</th><th>Created</th><th>State</th><th>Sign</th></tr>
        </thead><tbody>${noteRows}</tbody></table></div>` : '<p class="muted">No notes yet.</p>'}
      </div>

      <div class="card">
        <div class="card__header">
          <h2>Audit log <small>${verify}</small></h2>
          <div class="actions">
            <button class="btn btn--xs" id="btn-verify-audit">Verify chain</button>
            <button class="btn btn--xs btn--ghost" id="btn-tamper-audit">Tamper attempt (sim)</button>
          </div>
        </div>
        ${auditRows ? `<div class="table-wrap"><table class="data-table"><thead>
          <tr><th>When</th><th>Actor</th><th>Entity</th><th>Action</th><th>Hash</th></tr>
        </thead><tbody>${auditRows}</tbody></table></div>` : '<p class="muted">No audit events.</p>'}
      </div>
    </section>`;
}

export function bindEhr(render) {
  document.getElementById('form-new-note')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await createNote({
        patientId: state.patientId, clinicianId: CLINICIAN_DEMO, noteType: 'soap',
        subjective: fd.get('subjective') || undefined,
        objective: fd.get('objective') || undefined,
        assessment: fd.get('assessment') || undefined,
        plan: fd.get('plan') || undefined,
      });
      state.banner = 'SOAP note saved.';
      await refreshEhr(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });

  document.querySelectorAll('[data-note-sign]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-note-sign');
      try { await signNote(id); state.banner = 'Note signed and locked.'; await refreshEhr(); render(); }
      catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });

  document.getElementById('btn-verify-audit')?.addEventListener('click', async () => {
    try { state.verify = await verifyAuditChain(); render(); }
    catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.getElementById('btn-tamper-audit')?.addEventListener('click', async () => {
    try {
      const res = await simAuditTamper();
      state.banner = res.attempted
        ? `Tamper rejected by ${res.rejectedBy || 'database trigger'}. Verify chain to confirm intact.`
        : 'Nothing to tamper with yet (no audit events).';
      render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.getElementById('btn-record-consent')?.addEventListener('click', async () => {
    try {
      await createConsent({ patientId: state.patientId, consentType: 'telehealth', consentVersion: '1' });
      state.banner = 'Consent recorded.'; await refreshEhr(); render();
    } catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.getElementById('btn-upload-attachment')?.addEventListener('click', async () => {
    const input = document.getElementById('ehr-attachment-file');
    const file = input?.files?.[0];
    if (!file) { state.error = 'Pick a file first.'; render(); return; }
    try { await uploadAttachment(file, state.patientId); state.banner = 'Attachment uploaded.'; await refreshEhr(); render(); }
    catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.getElementById('btn-sim-attachment')?.addEventListener('click', async () => {
    try { await simUploadMockAttachment(state.patientId); state.banner = 'Sample attachment dropped.'; await refreshEhr(); render(); }
    catch (err) { state.error = err.body?.message || err.message; render(); }
  });
}
