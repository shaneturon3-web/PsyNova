import { createAppointment, getToken, health, login, logout, me, register } from './api.js';
import { defaultBookingState, bookingWizardHtml } from './booking-wizard.js';
import { uiLang } from './i18n.js';

const defaultLinks = {
  booking: import.meta.env.VITE_VENDOR_BOOKING_URL || '',
  telehealth: import.meta.env.VITE_VENDOR_TELEHEALTH_URL || '',
  forms: import.meta.env.VITE_VENDOR_FORMS_URL || '',
  documents: import.meta.env.VITE_VENDOR_DOCUMENTS_URL || '',
  billing: import.meta.env.VITE_VENDOR_BILLING_URL || '',
  privacy: import.meta.env.VITE_PRIVACY_URL || '#/legal',
};

const MOCK_CLINICIAN_ID = '00000000-0000-4000-8000-000000000001';

const SS_BOOKING = 'psynova_booking_draft';
const SS_RETURN = 'psynova_post_auth_route';

const state = {
  route: '/',
  user: null,
  health: null,
  healthError: null,
  formError: null,
  booking: defaultBookingState(),
  bookingError: null,
  bookingSuccess: null,
  _wasPortalish: undefined,
  postRegisterHint: null,
};

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const routeFromHash = () => { const raw = window.location.hash.replace(/^#/, '') || '/'; return raw.startsWith('/') ? raw : `/${raw}`; };
const navigate = (path) => { window.location.hash = path; };

function externalLink(key, label, className = 'button') {
  const href = defaultLinks[key];
  return !href || href === '#'
    ? `<button class="${className} button--disabled" type="button" disabled>${esc(label)} — vendor URL missing</button>`
    : `<a class="${className}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
}

async function refreshHealth() {
  try { state.health = await health(); state.healthError = null; }
  catch (error) { state.health = null; state.healthError = error?.message || 'Backend unavailable'; }
}
async function refreshUser() {
  if (!getToken()) { state.user = null; return; }
  try { state.user = (await me()).user; } catch { state.user = null; }
}

function header() {
  const authed = state.user
    ? '<button id="btn-logout" class="link-button" type="button">Log out</button>'
    : '<a class="clinic-nav__a" href="#/login">Sign in</a><a class="clinic-nav__a" href="#/register">Create account</a>';
  return `<header class="clinic-header"><a class="brand" href="#/"><span class="brand__mark">Ψ</span><span><strong>PsyNova</strong><small>Québec virtual psychology clinic</small></span></a><nav class="clinic-nav" aria-label="Primary"><a href="#/services">Services</a><a href="#/privacy">Privacy</a><a href="#/book">Book a session</a><a href="#/portal">Patient portal</a>${authed}</nav></header>`;
}
function complianceNotice() {
  return `<section class="notice" aria-label="Privacy and emergency notice"><strong>Important:</strong> PsyNova is an interface gateway only. Telehealth, records, documents, forms, and patient-data custody are handled by approved third-party systems. Do not submit emergencies here. For immediate danger, call 911 or go to the nearest emergency department.</section>`;
}
function footer() {
  return `<footer class="clinic-footer"><p>© PsyNova. Licensed practice governance and clinical services must be reviewed by the responsible Québec psychologist.</p><p><a href="#/privacy">Privacy and consent information</a></p></footer>`;
}
function page(body) { return `${header()}<main id="main" class="clinic-main">${complianceNotice()}${body}</main>${footer()}`; }

function homeView() {
  return page(`<section class="hero"><div><p class="eyebrow">Psychology services in Québec</p><h1>Secure access to care without keeping clinical records in this website.</h1><p class="lead">Book appointments, join telehealth, complete forms, exchange documents, and manage billing through dedicated third-party systems selected for privacy, custody, and professional workflow requirements.</p><div class="actions">${externalLink('booking', 'Book an appointment')}<a class="button button--secondary" href="#/portal">Open patient gateway</a></div></div><aside class="hero-card"><h2>Clinic interface scope</h2><ul><li>No local EHR or charting</li><li>No local clinical-note capture</li><li>No local document custody</li><li>No telehealth media storage</li></ul></aside></section><section class="grid"><article class="card"><h2>For patients</h2><p>Use the secure gateway to reach the appropriate approved system for each task.</p><a href="#/portal">Go to gateway</a></article><article class="card"><h2>For administrators</h2><p>Keep vendor URLs, public content, and notices current. Do not enter clinical data in PsyNova.</p><a href="#/admin">Admin surface</a></article><article class="card"><h2>Privacy first</h2><p>Personal and health information workflows are intentionally routed away from this website.</p><a href="#/privacy">Read notices</a></article></section>`);
}
function servicesView() {
  return page(`<section class="narrow"><h1>Services</h1><p>Psychological services are delivered by licensed professionals according to Québec practice governance. PsyNova presents public information and routes private workflows to approved third-party software.</p><div class="service-list"><article><h2>Online consultation</h2><p>Telehealth sessions are launched only through the clinic-approved telehealth system.</p></article><article><h2>Forms and consent</h2><p>Intake, consent, and clinical forms are completed in the approved form/document platform.</p></article><article><h2>Records and documents</h2><p>Clinical records and document custody remain outside PsyNova.</p></article></div></section>`);
}
function portalView() {
  const top = `<section class="narrow"><p class="eyebrow">Patient gateway</p><h1>Continue in the appropriate secure system</h1><p class="lead">These links leave PsyNova and open the clinic-approved platform for each task.</p><div class="portal-grid"><article class="portal-tile"><h2>Book</h2><p>Schedule or modify appointments.</p>${externalLink('booking', 'Open booking')}</article><article class="portal-tile"><h2>Telehealth</h2><p>Join a video session.</p>${externalLink('telehealth', 'Join telehealth')}</article><article class="portal-tile"><h2>Forms</h2><p>Complete intake and consent forms.</p>${externalLink('forms', 'Open forms')}</article><article class="portal-tile"><h2>Documents</h2><p>Exchange secure documents.</p>${externalLink('documents', 'Open documents')}</article><article class="portal-tile"><h2>Billing</h2><p>View invoices and payment links.</p>${externalLink('billing', 'Open billing')}</article></div>`;

  const bookingTestIntro = `<section class="portal-booking-test narrow" aria-labelledby="portal-booking-test-title"><h2 id="portal-booking-test-title">Local booking (DRAFT mock) — in-app test</h2>
    <p class="muted" style="margin-top:0;">This block uses the PsyNova <strong>mock</strong> appointment flow (maquette, not a vendor EHR). It is separate from the <strong>Open booking</strong> tile above, which is for your clinic-approved third-party system.</p>
    <p class="muted">For compliance posture, production booking should go through the approved platform; this section is for developer/staff testing only.</p>
    ${state.bookingSuccess ? `<p class="status-ok" role="status">${esc(state.bookingSuccess)}</p>` : ''}
    ${state.bookingError ? `<p class="error">${esc(state.bookingError)}</p>` : ''}
    ${!state.user?.sub ? '<p class="muted">To go through <strong>specialty → date → time</strong> first, use <a href="#/book">Book a session</a>. You will be sent to create an account (or sign in) only to confirm. Or <a href="#/login">sign in</a> here to submit if you are already registered.</p>' : ''}
    <div class="main main--booking" id="main-booking">`;
  const bookingBody = `${bookingWizardHtml(state.booking, esc, state.user, null)}</div></section>`;

  return page(`${top}</section>${bookingTestIntro}${bookingBody}`);
}
function privacyView() {
  return page(`<section class="narrow"><h1>Privacy, consent, and custody notice</h1><p>PsyNova is not the clinic system of record. It does not intentionally collect clinical notes, psychotherapy records, telehealth recordings, diagnostic material, or uploaded patient documents.</p><p>Private patient workflows are handled by third-party systems selected by the clinic. Review the clinic privacy policy, vendor privacy notices, and consent documents before using those systems.</p><p>Never send urgent clinical information through this public interface.</p>${externalLink('privacy', 'Open full privacy policy', 'button button--secondary')}</section>`);
}
function registerView() {
  return page(`<section class="auth-card"><h1>Create account</h1><p>Patient (mock) — same API as the full maquette. You can return to your booking after register.</p><form id="form-register"><label>Email <input name="email" type="email" autocomplete="email" required /></label><label>Password (min 8) <input name="password" type="password" autocomplete="new-password" minlength="8" required /></label><label>Role <select name="role"><option value="patient">Patient</option><option value="clinician">Clinician</option><option value="admin">Admin</option></select></label><label>Preferred language <select name="preferredLanguage"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option></select></label>${state.formError ? `<p class="error">${esc(state.formError)}</p>` : ''}<button class="button" type="submit">Register</button><p class="muted"><a href="#/login">Sign in</a> · <a href="#/book">Back to booking</a> · <a href="#/">Home</a></p></form></section>`);
}
function bookView() {
  const pre = !state.user?.sub
    ? '<p class="muted" style="margin-top:0">Choose a reason, date, and time first. You will be asked to create an account (or sign in) only on the <strong>last</strong> step. Same mock handoff as the legacy maquette.</p>'
    : '<p class="status-ok" role="status">Signed in — confirm below or use the patient portal.</p>';
  return page(
    `<section class="narrow portal-booking-test"><h1>Book a session (mock)</h1>${pre}${state.bookingSuccess ? `<p class="status-ok" role="status">${esc(state.bookingSuccess)}</p>` : ''}${state.bookingError ? `<p class="error">${esc(state.bookingError)}</p>` : ''}<div class="main main--booking" id="main-booking">${bookingWizardHtml(state.booking, esc, state.user, null)}</div><p class="muted" style="margin-top:1rem">Vendor systems: <a href="#/portal">Patient portal</a></p></section>`,
  );
}
function loginView() {
  const hint = state.postRegisterHint ? `<p class="status-ok" role="status">${esc(state.postRegisterHint)}</p>` : '';
  return page(`<section class="auth-card"><h1>Sign in</h1><p>Use the same account as the full maquette to confirm a booking draft.</p>${hint}<form id="form-login"><label>Email <input name="email" type="email" autocomplete="email" required /></label><label>Password <input name="password" type="password" autocomplete="current-password" required /></label>${state.formError ? `<p class="error">${esc(state.formError)}</p>` : ''}<button class="button" type="submit">Sign in</button><p class="muted"><a href="#/register">Create account</a> · <a href="#/book">Book a session</a> · <a href="#/">Home</a></p></form></section>`);
}
function adminView() {
  if (!state.user) return loginView();
  const healthText = state.healthError ? `<p class="error">${esc(state.healthError)}</p>` : `<pre>${esc(JSON.stringify(state.health, null, 2))}</pre>`;
  return page(`<section class="narrow"><h1>Admin surface</h1><p>Use this app for public content, routing, and vendor-link configuration only. Do not enter clinical records or patient documents.</p><h2>Backend health</h2>${healthText}<h2>Configured public vendor links</h2><ul class="vendor-list">${Object.entries(defaultLinks).map(([key, url]) => `<li><strong>${esc(key)}</strong>: ${url ? esc(url) : 'missing'}</li>`).join('')}</ul></section>`);
}
const notFoundView = () => page('<section class="narrow"><h1>Page not found</h1><a href="#/">Return home</a></section>');

function render() {
  const route = routeFromHash();
  if (route === '/book') {
    if (typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(SS_BOOKING);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && typeof p === 'object') state.booking = { ...defaultBookingState(), ...p };
        }
      } catch {
        /* */
      }
    }
  }
  const portalish =
    route === '/portal' || route === '/book' || (route && route.startsWith('/app'));
  if (state._wasPortalish && !portalish) {
    state.bookingError = null;
    state.bookingSuccess = null;
  }
  state._wasPortalish = portalish;
  state.route = route;

  const routes = {
    '/': homeView,
    '/services': servicesView,
    '/portal': portalView,
    '/book': bookView,
    '/privacy': privacyView,
    '/legal': privacyView,
    '/login': loginView,
    '/register': registerView,
    '/admin': adminView,
    '/app': portalView,
    '/app/appointments': portalView,
    '/app/telehealth': portalView,
    '/app/ehr': portalView,
    '/app/billing': portalView,
    '/app/messages': portalView,
  };
  document.getElementById('app').innerHTML = (routes[state.route] || notFoundView)();
  bind();
}

function bind() {
  document.getElementById('form-login')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.formError = null;
    state.postRegisterHint = null;
    const form = new FormData(event.target);
    try {
      await login({ email: form.get('email'), password: form.get('password') });
      await refreshUser();
      await refreshHealth();
      let next = null;
      try {
        next = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SS_RETURN) : null;
        if (next && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SS_RETURN);
        }
      } catch {
        /* */
      }
      navigate(next || '/admin');
    } catch (error) {
      state.formError = error?.body?.message || error?.message || 'Sign-in failed';
      render();
    }
  });
  document.getElementById('form-register')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.formError = null;
    const form = new FormData(event.target);
    try {
      await register({
        email: form.get('email'),
        password: form.get('password'),
        role: form.get('role') || 'patient',
        preferredLanguage: form.get('preferredLanguage') || 'en',
      });
      state.formError = null;
      state.postRegisterHint = 'Account created. Sign in with the same password to confirm your booking.';
      navigate('/login');
    } catch (error) {
      state.formError = Array.isArray(error?.body?.message)
        ? error.body.message.join(', ')
        : error?.body?.message || error?.message || 'Registration failed';
      render();
    }
  });
  document.getElementById('btn-logout')?.addEventListener('click', async () => { try { await logout(); } finally { state.user = null; navigate('/'); } });
}

function onAppClickBooking(e) {
  const wz = e.target.closest('.booking-wizard');
  if (!wz) return;
  const t = e.target.closest('button');
  if (!t) return;

  if (t.id === 'booking-cal-prev') {
    state.booking.calMonth -= 1;
    if (state.booking.calMonth < 0) {
      state.booking.calMonth = 11;
      state.booking.calYear -= 1;
    }
    render();
    return;
  }
  if (t.id === 'booking-cal-next') {
    state.booking.calMonth += 1;
    if (state.booking.calMonth > 11) {
      state.booking.calMonth = 0;
      state.booking.calYear += 1;
    }
    render();
    return;
  }

  if (t.hasAttribute('data-booking-date')) {
    state.booking.dateStr = t.getAttribute('data-booking-date') || '';
    render();
    return;
  }
  if (t.hasAttribute('data-booking-time')) {
    state.booking.timeStr = t.getAttribute('data-booking-time') || '';
    render();
    return;
  }

  if (t.hasAttribute('data-booking-category')) {
    state.booking.categoryId = t.getAttribute('data-booking-category') || '';
    render();
    return;
  }

  if (t.id === 'booking-next-cat' && state.booking.categoryId) {
    state.booking.step = 2;
    render();
    return;
  }
  if (t.id === 'booking-back-2') {
    state.booking.step = 1;
    render();
    return;
  }
  if (t.id === 'booking-next-1' && state.booking.dateStr) {
    state.booking.step = 3;
    render();
    return;
  }
  if (t.id === 'booking-back-3') {
    state.booking.step = 2;
    render();
    return;
  }
  if (t.id === 'booking-next-2' && state.booking.timeStr) {
    state.booking.step = 4;
    render();
    return;
  }
  if (t.id === 'booking-next-3') {
    const r = wz.querySelector('input[name="sessionType"]:checked');
    state.booking.sessionType = r ? r.value : 'video';
    const ta = document.getElementById('booking-notes');
    state.booking.notes = ta ? ta.value : '';
    state.booking.step = 5;
    render();
    return;
  }
  if (t.id === 'booking-back-4') {
    state.booking.step = 3;
    render();
    return;
  }
  if (t.id === 'booking-back-5') {
    state.booking.step = 4;
    render();
  }
}

async function onAppSubmitBooking(e) {
  const form = e.target;
  if (form.id !== 'form-appt-booking') return;
  e.preventDefault();
  if (!state.user?.sub) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SS_BOOKING, JSON.stringify(state.booking));
        sessionStorage.setItem(SS_RETURN, '/book');
      }
    } catch {
      /* */
    }
    state.bookingError = null;
    navigate('/register');
    return;
  }
  state.bookingError = null;
  state.bookingSuccess = null;
  const start = new Date(`${state.booking.dateStr}T${state.booking.timeStr}:00`);
  const ends = new Date(start.getTime() + 50 * 60 * 1000);
  try {
    await createAppointment({
      patientId: state.user.sub,
      clinicianId: MOCK_CLINICIAN_ID,
      startsAt: start.toISOString(),
      endsAt: ends.toISOString(),
      status: 'pending',
      serviceCategory: state.booking.categoryId || undefined,
      sessionNotes: state.booking.notes?.trim() || undefined,
      sessionNotesClientLanguage: uiLang(),
    });
    state.booking = defaultBookingState();
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem(SS_BOOKING);
        sessionStorage.removeItem(SS_RETURN);
      } catch {
        /* */
      }
    }
    state.bookingSuccess = 'Mock appointment recorded (maquette / test only).';
    render();
  } catch (err) {
    state.bookingError = err.body?.message || err.message || 'Request failed';
    render();
  }
}

let bookingDelegationBound = false;
window.addEventListener('hashchange', render);

export async function init() {
  const appRoot = document.getElementById('app');
  if (appRoot && !bookingDelegationBound) {
    bookingDelegationBound = true;
    appRoot.addEventListener('click', onAppClickBooking);
    appRoot.addEventListener('submit', (ev) => { void onAppSubmitBooking(ev); });
  }
  await refreshUser();
  await refreshHealth();
  render();
}
