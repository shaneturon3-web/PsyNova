// [MOCKUP PURPOSE ONLY - NOT REAL DATA]
// Billing view: invoices table, sliding-scale quote, Stripe Checkout (real or sim),
// claim submit + adjudication, receipt download. Replaces the prior "Not implemented"
// gray view at #/app/billing.

import {
  listInvoices,
  createInvoice,
  createCheckoutSession,
  invoiceReceiptUrl,
  listClaims,
  createClaim,
  quoteService,
  simStripeWebhook,
  simAdjudicateClaim,
} from '../api.js';

const PATIENT_DEMO = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CLINICIAN_DEMO = '00000000-0000-4000-8000-000000000001';

const state = {
  invoices: [],
  claims: [],
  loading: false,
  error: null,
  banner: null,
  quote: null,
  isDev: true,
};

function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function fmt(c, currency = 'CAD') { return `${(Number(c || 0) / 100).toFixed(2)} ${currency}`; }

export async function refreshBilling(opts = {}) {
  state.loading = true;
  try {
    const [inv, cl] = await Promise.all([
      listInvoices(opts.clinicianId ? { clinicianId: opts.clinicianId } : {}),
      listClaims({}),
    ]);
    state.invoices = inv.items || [];
    state.claims = cl.items || [];
    state.error = null;
  } catch (e) {
    state.error = e.body?.message || e.message;
  } finally {
    state.loading = false;
  }
}

export function viewBilling() {
  const banner = state.banner ? `<div class="banner banner--success">${esc(state.banner)}</div>` : '';
  const err = state.error ? `<div class="banner banner--error">${esc(state.error)}</div>` : '';
  const rows = state.invoices.map((i) => `
    <tr>
      <td><code>${esc(i.id.slice(0, 8))}</code></td>
      <td><span class="status status--${esc(i.status)}">${esc(i.status)}</span></td>
      <td>${esc(fmt(i.totalCents, i.currency))}</td>
      <td>${esc(fmt(i.amountPaidCents, i.currency))}</td>
      <td>${esc(fmt(i.totalCents - i.amountPaidCents, i.currency))}</td>
      <td>${esc(new Date(i.createdAt).toLocaleString())}</td>
      <td class="actions">
        <button class="btn btn--xs" data-billing-checkout="${esc(i.id)}" ${i.status === 'paid' ? 'disabled' : ''}>Charge with Stripe</button>
        <button class="btn btn--xs btn--ghost" data-billing-claim="${esc(i.id)}">Submit RAMQ claim</button>
        <a class="btn btn--xs btn--ghost" href="${esc(invoiceReceiptUrl(i.id))}" target="_blank" rel="noopener">Receipt PDF</a>
      </td>
    </tr>`).join('');

  const claimRows = state.claims.map((c) => `
    <tr>
      <td><code>${esc(c.id.slice(0, 8))}</code></td>
      <td>${esc(c.payer)}</td>
      <td>${esc(c.serviceCode)}</td>
      <td>${esc(fmt(c.amountCents))}</td>
      <td><span class="status status--${esc(c.status)}">${esc(c.status)}</span></td>
      <td>${c.rejectionReason ? esc(c.rejectionReason) : ''}</td>
      <td class="actions">
        <button class="btn btn--xs" data-claim-sim="${esc(c.id)}" data-outcome="accepted" ${c.status !== 'submitted' ? 'disabled' : ''}>Sim accept</button>
        <button class="btn btn--xs btn--ghost" data-claim-sim="${esc(c.id)}" data-outcome="rejected" ${c.status !== 'submitted' ? 'disabled' : ''}>Sim reject</button>
      </td>
    </tr>`).join('');

  const quote = state.quote ? `
    <p class="quote-result">
      Service: <strong>${esc(state.quote.serviceCode)}</strong>
      Base: ${esc(fmt(state.quote.basePriceCents, state.quote.currency))}
      Discount: ${esc(state.quote.discountPct)}%
      <strong>Final: ${esc(fmt(state.quote.finalCents, state.quote.currency))}</strong>
    </p>` : '';

  return `
    <section class="app-shell">
      <header class="app-shell__header">
        <h1>Billing <small class="tag">[DRAFT]</small></h1>
        <p class="muted">Invoices, payments, RAMQ/insurer claims, sliding-scale pricing. <a href="#/app">&larr; Dashboard</a></p>
      </header>
      ${banner}${err}

      <div class="card">
        <h2>Sliding-scale quote</h2>
        <form id="form-quote" class="form-grid">
          <label>Service code <input name="serviceCode" value="individual_session" /></label>
          <label>Annual income (CAD, optional) <input name="incomeDollars" type="number" min="0" placeholder="e.g. 28000" /></label>
          <button type="submit" class="btn">Quote</button>
        </form>
        ${quote}
      </div>

      <div class="card">
        <div class="card__header">
          <h2>Invoices</h2>
          <div class="actions">
            <button class="btn" id="btn-create-demo-invoice">Create demo invoice ($150)</button>
            <button class="btn btn--ghost" id="btn-refresh-billing">Refresh</button>
          </div>
        </div>
        ${rows ? `<div class="table-wrap"><table class="data-table"><thead>
          <tr><th>ID</th><th>Status</th><th>Total</th><th>Paid</th><th>Due</th><th>Created</th><th>Actions</th></tr>
        </thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No invoices yet. Click "Create demo invoice".</p>'}
      </div>

      <div class="card">
        <h2>Claims</h2>
        ${claimRows ? `<div class="table-wrap"><table class="data-table"><thead>
          <tr><th>ID</th><th>Payer</th><th>Service</th><th>Amount</th><th>Status</th><th>Reason</th><th>Sim</th></tr>
        </thead><tbody>${claimRows}</tbody></table></div>` : '<p class="muted">No claims yet. Use "Submit RAMQ claim" on an invoice.</p>'}
      </div>
    </section>`;
}

/**
 * @param {() => void} render — caller's render function, invoked after each state mutation.
 */
export function bindBilling(render) {
  document.getElementById('btn-refresh-billing')?.addEventListener('click', async () => {
    state.banner = null; await refreshBilling(); render();
  });
  document.getElementById('btn-create-demo-invoice')?.addEventListener('click', async () => {
    try {
      await createInvoice({
        patientId: PATIENT_DEMO, clinicianId: CLINICIAN_DEMO,
        items: [{ description: 'Individual psychotherapy session (50 min)', serviceCode: 'individual_session', quantity: 1, unitPriceCents: 15000 }],
        notes: 'Demo invoice generated from /app/billing',
      });
      state.banner = 'Created demo invoice.';
      await refreshBilling(); render();
    } catch (e) { state.error = e.body?.message || e.message; render(); }
  });
  document.getElementById('form-quote')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const code = String(fd.get('serviceCode') || '').trim();
    const income = fd.get('incomeDollars');
    const incomeCents = income ? Math.round(Number(income) * 100) : undefined;
    try { state.quote = await quoteService(code, incomeCents); state.error = null; render(); }
    catch (err) { state.error = err.body?.message || err.message; render(); }
  });
  document.querySelectorAll('[data-billing-checkout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-billing-checkout');
      try {
        const res = await createCheckoutSession(id);
        if (res.mode === 'live' && res.url) {
          window.open(res.url, '_blank', 'noopener');
          state.banner = 'Stripe Checkout opened in new tab. Use test card 4242 4242 4242 4242.';
        } else {
          // Mock mode — flip via simulator to keep the demo flowing.
          await simStripeWebhook(id);
          state.banner = 'Stripe not configured — invoice marked paid via simulator.';
        }
        await refreshBilling(); render();
      } catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
  document.querySelectorAll('[data-billing-claim]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const invoiceId = btn.getAttribute('data-billing-claim');
      try {
        await createClaim(invoiceId, { serviceCode: '99213', payer: 'ramq', diagnosisCode: 'F41.1' });
        state.banner = 'Claim submitted. Use "Sim accept" or "Sim reject" to adjudicate.';
        await refreshBilling(); render();
      } catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
  document.querySelectorAll('[data-claim-sim]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-claim-sim');
      const outcome = btn.getAttribute('data-outcome');
      try {
        await simAdjudicateClaim(id, outcome, outcome === 'rejected' ? 'Diagnosis code not covered' : undefined);
        state.banner = `Claim ${outcome}.`;
        await refreshBilling(); render();
      } catch (err) { state.error = err.body?.message || err.message; render(); }
    });
  });
}
