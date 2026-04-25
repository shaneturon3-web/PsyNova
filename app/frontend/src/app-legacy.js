import {
  getToken,
  setToken,
  health,
  login,
  logout,
  me,
  register,
  listAppointments,
  createAppointment,
  submitContact,
  translateText,
} from './api.js';
import { bindCmsAdmin, viewCmsAdmin } from './cms-admin-panel.js';
import { cmsPatchField, fetchCmsBundle } from './cms-api.js';
import { heroPick, pickLocalizedText, resolveMediaUrl, stripHtml } from './cms-util.js';
import { defaultBookingState, bookingWizardHtml } from './booking-wizard.js';
import { categoryLabel, getCategoryById, DRAFT_SERVICE_CATEGORIES } from './service-categories.js';
import { t, tHtml, uiLang, setUiLang } from './i18n.js';
import {
  formDisclaimerBlock,
  globalContentDisclaimer,
  mockupStripHtml,
  siteFooterDisclaimer,
} from './disclaimers.js';
import { legalPageHtml } from './legal-content.js';

const MOCK_CLINICIAN_ID = '00000000-0000-4000-8000-000000000001';

/** Local-only “UI preview” sign-in: empty password skips API. Not a real JWT. */
const PSYNOVA_DEMO_UI_TOKEN = 'psynova-demo-ui-bypass';
const HOME_CARD_ICONS = ['🧠', '💬', '🌿', '📅', '🛡️', '✨'];
const SERVICE_CARD_ICONS = ['🧠', '🌙', '💬', '🌿', '🤝', '✨'];
const TEAM_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
];

/** Kept in sync with compliance shell for the same handoff. */
const SS_BOOKING = 'psynova_booking_draft';
const SS_RETURN = 'psynova_post_auth_route';

const state = {
  route: '/',
  user: null,
  health: null,
  healthError: null,
  appointments: null,
  listError: null,
  formError: null,
  banner: null,
  booking: defaultBookingState(),
  cms: { bundle: null, loading: false, error: null },
  demo: {
    therapists: [],
    patients: [],
    appointments: [],
    messages: [],
    emails: [],
    records: [],
    bookingConfirmation: null,
  },
};

function buildDemoData() {
  const therapists = [
    {
      id: 'th-01',
      name: 'Dr. Mira Rowan',
      title: 'Psychologist (DEMO / FICTIONAL)',
      specialties: ['CBT', 'Anxiety', 'Mindfulness'],
      languages: ['English', 'French'],
      availability: 'Mon-Thu 09:00-17:00',
      email: 'mira.rowan@demo.psynova.local',
      phone: '+1 514-555-0101',
      avatarUrl: TEAM_FALLBACK_IMAGES[0],
      bio: 'Demo therapist profile for UI testing only.',
      licenseStatus: 'Mock license verified (fictional)',
    },
    {
      id: 'th-02',
      name: 'Noah Vale, LCSW',
      title: 'Clinical Social Worker (DEMO / FICTIONAL)',
      specialties: ['Depression', 'Trauma', 'Youth'],
      languages: ['English', 'Spanish'],
      availability: 'Tue-Fri 10:00-18:00',
      email: 'noah.vale@demo.psynova.local',
      phone: '+1 514-555-0102',
      avatarUrl: TEAM_FALLBACK_IMAGES[1],
      bio: 'Trauma-informed and youth-focused demo profile.',
      licenseStatus: 'Mock active status (fictional)',
    },
    {
      id: 'th-03',
      name: 'Ari Bennett',
      title: 'Psychotherapist (DEMO / FICTIONAL)',
      specialties: ['Couples', 'Communication', 'Mindfulness'],
      languages: ['English', 'French'],
      availability: 'Mon-Fri 12:00-20:00',
      email: 'ari.bennett@demo.psynova.local',
      phone: '+1 514-555-0103',
      avatarUrl: TEAM_FALLBACK_IMAGES[2],
      bio: 'Couples and communication demo specialist.',
      licenseStatus: 'Mock supervised practice (fictional)',
    },
    {
      id: 'th-04',
      name: 'Dr. Lina Ortega',
      title: 'Psychiatric Consultant (DEMO / FICTIONAL)',
      specialties: ['ADHD', 'Anxiety', 'Medication planning'],
      languages: ['English', 'Spanish', 'French'],
      availability: 'Wed-Sat 08:00-16:00',
      email: 'lina.ortega@demo.psynova.local',
      phone: '+1 514-555-0104',
      avatarUrl: TEAM_FALLBACK_IMAGES[3],
      bio: 'ADHD and anxiety planning, demo only.',
      licenseStatus: 'Mock specialist listing (fictional)',
    },
    {
      id: 'th-05',
      name: 'Samira Khan',
      title: 'Registered Therapist (DEMO / FICTIONAL)',
      specialties: ['Trauma', 'Depression', 'CBT'],
      languages: ['English', 'French', 'Urdu'],
      availability: 'Mon-Thu 11:00-19:00',
      email: 'samira.khan@demo.psynova.local',
      phone: '+1 514-555-0105',
      avatarUrl: TEAM_FALLBACK_IMAGES[0],
      bio: 'Trauma and depression mock care pathways.',
      licenseStatus: 'Mock registration active (fictional)',
    },
    {
      id: 'th-06',
      name: 'Eli Park',
      title: 'Virtual Care Clinician (DEMO / FICTIONAL)',
      specialties: ['Youth', 'Family', 'Mindfulness'],
      languages: ['English', 'Korean'],
      availability: 'Sun-Thu 09:00-15:00',
      email: 'eli.park@demo.psynova.local',
      phone: '+1 514-555-0106',
      avatarUrl: TEAM_FALLBACK_IMAGES[1],
      bio: 'Family and youth support in virtual settings (demo).',
      licenseStatus: 'Mock telehealth provider (fictional)',
    },
  ];
  const patients = [
    ['pt-01', 'Avery Cole', 28, 'avery.cole@demo.mail', '+1 438-555-1001', 'th-01', '2026-04-29 09:00', '2026-04-15', 'active', ['anxiety', 'sleep'], 'Practicing breathing plan; improved sleep cadence.'],
    ['pt-02', 'Jordan Price', 34, 'jordan.price@demo.mail', '+1 438-555-1002', 'th-02', '2026-04-30 10:30', '2026-04-16', 'active', ['trauma'], 'Stabilization goals; journaling adherence moderate.'],
    ['pt-03', 'Mina Patel', 19, 'mina.patel@demo.mail', '+1 438-555-1003', 'th-06', '2026-04-28 14:00', '2026-04-14', 'new', ['youth', 'school'], 'Orientation session complete; consent reviewed.'],
    ['pt-04', 'Leo Martin', 41, 'leo.martin@demo.mail', '+1 438-555-1004', 'th-03', '2026-05-01 13:00', '2026-04-11', 'active', ['couples'], 'Communication worksheet assigned.'],
    ['pt-05', 'Nina Flores', 32, 'nina.flores@demo.mail', '+1 438-555-1005', 'th-04', '2026-05-02 11:00', '2026-04-13', 'follow-up', ['adhd'], 'Executive function routine in progress.'],
    ['pt-06', 'Owen Blake', 47, 'owen.blake@demo.mail', '+1 438-555-1006', 'th-05', '2026-05-03 15:30', '2026-04-18', 'active', ['depression'], 'Behavioral activation plan updated.'],
    ['pt-07', 'Sara Kim', 26, 'sara.kim@demo.mail', '+1 438-555-1007', 'th-01', '2026-05-04 09:30', '2026-04-19', 'paused', ['anxiety', 'mindfulness'], 'Paused for exams; check-in reminder sent.'],
    ['pt-08', 'Tom Rivera', 38, 'tom.rivera@demo.mail', '+1 438-555-1008', 'th-02', '2026-05-05 16:00', '2026-04-20', 'active', ['trauma', 'cbt'], 'Exposure hierarchy reviewed; no red flags.'],
  ].map(([id, name, age, email, phone, therapistId, upcomingAppointment, lastSession, status, tags, notes]) => ({
    id,
    name,
    age,
    email,
    phone,
    therapistId,
    upcomingAppointment,
    lastSession,
    status,
    tags,
    notes,
  }));
  const appointments = [
    { id: 'apt-201', therapistId: 'th-01', patientId: 'pt-01', service: 'Anxiety support', startsAt: '2026-04-29 09:00', sessionType: 'video', status: 'pending' },
    { id: 'apt-202', therapistId: 'th-02', patientId: 'pt-02', service: 'Trauma follow-up', startsAt: '2026-04-30 10:30', sessionType: 'video', status: 'confirmed' },
    { id: 'apt-203', therapistId: 'th-06', patientId: 'pt-03', service: 'Youth intake', startsAt: '2026-04-28 14:00', sessionType: 'in_person', status: 'pending' },
    { id: 'apt-204', therapistId: 'th-03', patientId: 'pt-04', service: 'Couples therapy', startsAt: '2026-05-01 13:00', sessionType: 'video', status: 'cancelled' },
  ];
  const messages = [
    { id: 'msg-1', from: 'Avery Cole', to: 'Dr. Mira Rowan', subject: 'Reschedule request', preview: 'Can we move next week to Thursday?', unread: true, time: '2026-04-24 09:12' },
    { id: 'msg-2', from: 'Noah Vale, LCSW', to: 'Jordan Price', subject: 'Homework reminder', preview: 'Please complete worksheet 2 before Friday.', unread: false, time: '2026-04-23 18:01' },
    { id: 'msg-3', from: 'Sara Kim', to: 'Dr. Mira Rowan', subject: 'Quick check-in', preview: 'Symptoms better this week, thanks.', unread: true, time: '2026-04-24 14:22' },
  ];
  const emails = [
    { id: 'mail-1', type: 'Appointment confirmation', recipient: 'avery.cole@demo.mail', status: 'sent', time: '2026-04-24 08:40' },
    { id: 'mail-2', type: 'Session reminder', recipient: 'tom.rivera@demo.mail', status: 'queued', time: '2026-04-24 09:05' },
    { id: 'mail-3', type: 'Follow-up summary', recipient: 'nina.flores@demo.mail', status: 'sent', time: '2026-04-23 16:30' },
  ];
  const records = [
    { id: 'rec-1', patient: 'Avery Cole', therapist: 'Dr. Mira Rowan', date: '2026-04-15', type: 'Session note', status: 'signed', summary: 'Sleep hygiene and panic triggers reviewed.' },
    { id: 'rec-2', patient: 'Jordan Price', therapist: 'Noah Vale, LCSW', date: '2026-04-16', type: 'Progress note', status: 'draft', summary: 'Grounding tools practiced, stress scale improved.' },
    { id: 'rec-3', patient: 'Mina Patel', therapist: 'Eli Park', date: '2026-04-14', type: 'Intake', status: 'signed', summary: 'Initial goals and consent confirmed (DEMO).' },
    { id: 'rec-4', patient: 'Leo Martin', therapist: 'Ari Bennett', date: '2026-04-11', type: 'Couples session', status: 'signed', summary: 'Communication pattern mapping complete.' },
  ];
  return { therapists, patients, appointments, messages, emails, records, bookingConfirmation: null };
}
state.demo = buildDemoData();

function routeFromHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function navigate(path) {
  window.location.hash = path;
}

function mergeBookingFromSession() {
  if (typeof sessionStorage === 'undefined') return;
  const raw = sessionStorage.getItem(SS_BOOKING);
  if (!raw) return;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object') {
      state.booking = { ...defaultBookingState(), ...p };
    }
  } catch {
    /* invalid draft */
  }
}

function clearBookingHandoff() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(SS_BOOKING);
    sessionStorage.removeItem(SS_RETURN);
  } catch {
    /* */
  }
}

function requireAuth() {
  if (!getToken() || !state.user) {
    state.banner = 'Sign in to continue.';
    navigate('/login');
    return false;
  }
  return true;
}

async function refreshHealth() {
  try {
    state.health = await health();
    state.healthError = null;
  } catch (e) {
    state.health = null;
    state.healthError = e.message || 'Backend unreachable';
  }
}

async function refreshUser() {
  if (!getToken()) {
    state.user = null;
    return;
  }
  if (getToken() === PSYNOVA_DEMO_UI_TOKEN) {
    const em =
      (typeof localStorage !== 'undefined' && localStorage.getItem('psynova_demo_email')) || 'therapist@demo.local';
    state.user = {
      sub: 'd0000000-0000-4000-8000-0000000000dd',
      email: em,
      role: 'therapist',
    };
    return;
  }
  try {
    const r = await me();
    state.user = r.user;
  } catch {
    state.user = null;
  }
}

async function loadCms() {
  state.cms.loading = true;
  state.cms.error = null;
  try {
    const preview =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('psynova_cms_preview') === '1';
    state.cms.bundle = await fetchCmsBundle({ preview });
  } catch (e) {
    state.cms.error = e.message || String(e);
    state.cms.bundle = null;
  } finally {
    state.cms.loading = false;
  }
}

async function refreshAppointments() {
  state.listError = null;
  state.appointments = null;
  if (!state.user?.sub) return;
  try {
    const r = await listAppointments({ patientId: state.user.sub });
    state.appointments = r;
  } catch (e) {
    state.listError = e.body?.message || e.message || 'Failed to load';
  }
}

function shellSidebar(isAuthed) {
  if (!isAuthed) return '';
  const r = state.route;
  const link = (path, labelKey, disabled, title) => {
    if (disabled) {
      return `<span class="nav-link disabled" aria-disabled="true" title="${esc(title)}">${esc(t(labelKey))}</span>`;
    }
    const cur = r === path ? ' aria-current="page"' : '';
    return `<a class="nav-link" href="#${path}"${cur}>${esc(t(labelKey))}</a>`;
  };
  const adminLink =
    state.user?.role === 'admin'
      ? `${link('/app/admin', 'sidebar_admin', false)}
      ${link('/app/cms', 'sidebar_cms', false)}`
      : '';
  return `
    <aside class="sidebar" role="navigation" aria-label="App">
      <div class="sidebar__brand">PsyNova</div>
      <div class="sidebar__tag">[DRAFT]</div>
      <a class="nav-link" href="#/">${esc(t('nav_home'))}</a>
      ${link('/app', 'sidebar_dashboard', false)}
      ${link('/app/appointments', 'sidebar_appts', false)}
      ${link('/app/messages', 'sidebar_messages', false)}
      ${link('/app/telehealth', 'sidebar_telehealth', true, 'Not implemented')}
      ${link('/app/billing', 'sidebar_billing', true, 'Not implemented')}
      ${link('/app/ehr', 'sidebar_ehr', true, 'Not implemented')}
      ${link('/app/clinician', 'sidebar_clinician', true, 'Not implemented')}
      ${adminLink}
      ${link('/app/settings', 'sidebar_settings', false)}
      <div style="margin-top:auto;padding-top:1rem;">
        <a class="nav-link" href="#/legal">${esc(t('sidebar_privacy'))}</a>
      </div>
    </aside>
  `;
}

function langSwitcher() {
  const L = uiLang();
  return `<div class="lang-switch">
    <label class="lang-switch__lbl" for="psynova-lang">${esc(t('lang_label'))}</label>
    <select id="psynova-lang" class="lang-switch__sel" aria-label="${esc(t('lang_label'))}">
      <option value="fr" ${L === 'fr' ? 'selected' : ''}>FR</option>
      <option value="en" ${L === 'en' ? 'selected' : ''}>EN</option>
      <option value="es" ${L === 'es' ? 'selected' : ''}>ES</option>
    </select>
  </div>`;
}

function publicNav(currentPath) {
  const item = (path, key) => {
    const cur =
      currentPath === path ||
      (path === '/blog' && currentPath.startsWith('/blog/')) ||
      (path === '/team' && (currentPath === '/team' || currentPath.startsWith('/team/')))
        ? ' public-nav__a--current'
        : '';
    return `<a class="public-nav__a${cur}" href="#${path}">${esc(t(key))}</a>`;
  };
  return `<nav class="public-nav public-nav--bar" aria-label="Site">
    <button type="button" class="public-nav__menu-btn" id="public-nav-menu" aria-expanded="false" aria-controls="public-nav-links">
      ${esc(t('nav_menu'))}
    </button>
    <div class="public-nav__links" id="public-nav-links">
    ${item('/', 'nav_home')}
    ${item('/about', 'nav_about')}
    ${item('/services', 'nav_services')}
    ${item('/team', 'nav_team')}
    <a class="public-nav__a${currentPath === '/therapist-demo' ? ' public-nav__a--current' : ''}" href="#/therapist-demo">Therapist Demo</a>
    ${item('/blog', 'nav_blog')}
    ${item('/contact', 'nav_contact')}
    ${item('/book', 'nav_book')}
    <a class="public-nav__a${currentPath === '/records-demo' ? ' public-nav__a--current' : ''}" href="#/records-demo">Records Demo</a>
    </div>
    <span class="public-nav__sp" aria-hidden="true"></span>
    <div class="public-nav__tools">
    ${langSwitcher()}
    <a class="public-nav__a" href="/api/docs" target="_blank" rel="noreferrer">${esc(t('nav_api'))}</a>
    ${item('/login', 'nav_login')}
    ${item('/register', 'nav_register')}
    </div>
  </nav>`;
}

/** Admin-only: click-to-edit dashed fields on public routes (session opt-out with `psynova_cms_inline=0`). */
function adminHumanCorrectionHint() {
  if (typeof sessionStorage === 'undefined') return '';
  if (state.user?.role !== 'admin' || sessionStorage.getItem('psynova_cms_inline') === '0') return '';
  return `<div class="admin-human-correction-hint card" role="status">
    <p class="admin-human-correction-hint__p">${esc(t('cms_inline_banner'))}
      <a class="btn btn--ghost" href="#/app/cms">CMS</a>
      <button type="button" class="btn btn--ghost" id="btn-disable-inline">${esc(t('cms_inline_disable'))}</button>
    </p>
  </div>`;
}

function publicPageWrap(bodyHtml, currentPath) {
  return `
    <div class="main public-page">
      <a class="skip-link" href="#main">${esc(t('skip_content'))}</a>
      ${mockupStripHtml()}
      ${globalContentDisclaimer()}
      ${adminHumanCorrectionHint()}
      ${publicNav(currentPath)}
      <div class="public-inner" id="main">${bodyHtml}</div>
      ${siteFooterDisclaimer()}
    </div>`;
}

function viewLanding() {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return `
    <div class="main public-page">
      <a class="skip-link" href="#main">${esc(t('skip_content'))}</a>
      ${mockupStripHtml()}
      ${globalContentDisclaimer()}
      ${adminHumanCorrectionHint()}
      ${publicNav('/')}
      <div class="hero hero--wide" id="main"><p class="muted">Loading content…</p></div>
      ${siteFooterDisclaimer()}
    </div>`;
  }
  if (!b || state.cms?.error) {
    return publicPageWrap(
      `<p class="error-msg">Content unavailable (${esc(state.cms?.error || 'unknown')}). Is the API running?</p>`,
      '/',
    );
  }
  const heroSec = b.homeSections?.find((h) => h.sectionType === 'hero');
  const hero = heroPick(heroSec?.payload || {}, lang);
  const fg = b.homeSections?.find((h) => h.sectionType === 'feature_grid');
  const gridCards = fg?.payload?.cards || [];
  const ts = b.homeSections?.find((h) => h.sectionType === 'testimonial_strip');
  const th = ts?.payload?.heading
    ? ts.payload.heading[lang] || ts.payload.heading.en || ''
    : '';
  const cardHtml = gridCards
    .map((c, idx) => {
      const title = c.title?.[lang] || c.title?.en || '';
      const blurb = c.blurb?.[lang] || c.blurb?.en || '';
      const href = c.href || '#';
      const icon = HOME_CARD_ICONS[idx % HOME_CARD_ICONS.length];
      return `<a class="home-card" href="${esc(href)}"><div class="home-card__icon" aria-hidden="true">${icon}</div><h3>${esc(title)}</h3><p class="muted">${esc(blurb)}</p></a>`;
    })
    .join('');
  const tests = [...(b.testimonials || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const testHtml = tests
    .map((t) => {
      const author = pickLocalizedText(t, 'author', lang);
      const quote = pickLocalizedText(t, 'quote', lang);
      const url = resolveMediaUrl(b, t.avatarMediaId);
      return `<figure class="cms-testimonial"><img class="cms-testimonial__img" src="${esc(url || '')}" alt="" width="72" height="72" loading="lazy" /><blockquote class="cms-testimonial__q">${quote}</blockquote><figcaption>${esc(author)}</figcaption></figure>`;
    })
    .join('');
  return `
    <div class="main public-page">
      <a class="skip-link" href="#main">${esc(t('skip_content'))}</a>
      ${mockupStripHtml()}
      ${globalContentDisclaimer()}
      ${adminHumanCorrectionHint()}
      ${publicNav('/')}
      <div class="hero hero--wide hero--split" id="main">
        <div class="hero__content">
          <h1>${esc(hero.title)}</h1>
          <div class="muted hero__lead">${hero.lead}</div>
          <p class="hero__actions">
            <a class="btn" href="${esc(hero.ctaPrimary?.href || '#/register')}">${esc(hero.ctaPrimary?.label || '')}</a>
            <a class="btn btn--ghost" href="${esc(hero.ctaSecondary?.href || '#/legal')}">${esc(hero.ctaSecondary?.label || '')}</a>
            <a class="btn btn--ghost" href="${esc(hero.ctaBook?.href || '#/book')}">${esc(hero.ctaBook?.label || '')}</a>
          </p>
        </div>
        <div class="hero__visual card" aria-hidden="true">
          <img class="hero__image" src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80" alt="" loading="lazy" />
          <div class="hero__visual-caption">🌿 Calm, guided virtual support</div>
        </div>
        <div class="home-cards">${cardHtml}</div>
        ${
          th
            ? `<section class="cms-home-testimonials"><h2 class="public-h2">${esc(th)}</h2><div class="cms-testimonial-row">${testHtml}</div></section>`
            : ''
        }
      </div>
      ${siteFooterDisclaimer()}
    </div>`;
}

function viewAbout() {
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('about_title'))}</h1>
    <div class="card"><p>${tHtml('about_p1')}</p><p>${tHtml('about_p2')}</p></div>`,
    '/about',
  );
}

function viewServices() {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return publicPageWrap(`<p class="muted">Loading…</p>`, '/services');
  }
  if (!b || state.cms?.error) {
    return publicPageWrap(`<p class="error-msg">${esc(state.cms?.error || 'CMS unavailable')}</p>`, '/services');
  }
  const svcs = [...(b.services || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const titleKey = lang === 'fr' ? 'titleFr' : lang === 'es' ? 'titleEs' : 'titleEn';
  const cards = svcs
    .map((s, idx) => {
      const title = pickLocalizedText(s, 'title', lang);
      const body = pickLocalizedText(s, 'body', lang);
      const icon = SERVICE_CARD_ICONS[idx % SERVICE_CARD_ICONS.length];
      // BOOKING_FLOW_RESTORE: actionable specialty → opens `#/book` with category prefilled (see `onServiceCardOpenBooking`)
      return `<button type="button" class="service-card" data-booking-category="${esc(s.slug)}" aria-label="${esc(title)} — ${esc(t('nav_book'))}">
        <div class="service-card__icon" aria-hidden="true">${icon}</div>
        <h3 class="service-card__h"${cmsInlinePatchAttr('service', s.id, titleKey)}>${esc(title)}</h3>
        <div class="muted service-card__p">${body}</div>
      </button>`;
    })
    .join('');
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('services_title'))}</h1>
    <p class="muted public-lead">${esc(t('services_lead'))}</p>
    <div class="service-grid">${cards}</div>`,
    '/services',
  );
}

function viewTeam() {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return publicPageWrap(`<p class="muted">Loading…</p>`, '/team');
  }
  const hasCmsTeam = !!(b && !state.cms?.error && (b.doctors || []).length);
  const team = hasCmsTeam
    ? [...(b.doctors || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0))
    : state.demo.therapists.map((t, idx) => ({
        id: t.id,
        nameEn: t.name,
        roleEn: t.title,
        bioEn: t.bio,
        avatarMediaId: null,
        illustrationNote: `${t.licenseStatus} · ${t.availability}`,
        _fallbackAvatarUrl: t.avatarUrl,
        _specialties: t.specialties,
        _languages: t.languages,
        _isDemo: true,
        sortOrder: idx,
      }));
  const nameKey = lang === 'fr' ? 'nameFr' : lang === 'es' ? 'nameEs' : 'nameEn';
  const roleKey = lang === 'fr' ? 'roleFr' : lang === 'es' ? 'roleEs' : 'roleEn';
  const cards = team
    .map((m, idx) => {
      const name = pickLocalizedText(m, 'name', lang);
      const role = pickLocalizedText(m, 'role', lang);
      const bio = pickLocalizedText(m, 'bio', lang);
      const url = hasCmsTeam ? resolveMediaUrl(b, m.avatarMediaId) : m._fallbackAvatarUrl;
      const fallbackImg = TEAM_FALLBACK_IMAGES[idx % TEAM_FALLBACK_IMAGES.length];
      const ill = m.illustrationNote || '';
      const demoChips = m._specialties || ['CBT', 'Mindfulness', 'Virtual care'];
      const demoLang = m._languages ? ` · ${m._languages.join(' / ')}` : '';
      return `
    <article class="team-card">
      ${
        url
          ? `<div class="team-card__avatar team-card__avatar--img"><img src="${esc(url)}" alt="" width="96" height="96" loading="lazy" /></div>`
          : `<div class="team-card__avatar team-card__avatar--img"><img src="${esc(fallbackImg)}" alt="" width="96" height="96" loading="lazy" /></div>`
      }
      <h3 class="team-card__name"${cmsInlinePatchAttr('doctor', m.id, nameKey)}>${esc(name)}</h3>
      <p class="team-card__role"${cmsInlinePatchAttr('doctor', m.id, roleKey)}>${esc(role)}</p>
      <div class="team-card__chips">${demoChips
        .map((x) => `<span>${esc(x)}</span>`)
        .join('')}</div>
      <div class="team-card__bio">${bio}</div>
      ${m._isDemo ? `<p class="muted team-card__meta">DEMO / FICTIONAL${esc(demoLang)}</p>` : ''}
      <p class="team-card__illust muted"><em>${esc(ill)}</em></p>
      <p class="team-card__cta"><a class="btn btn--small btn--ghost" href="#/book">Book session</a> <a class="btn btn--small btn--ghost" href="#/team/${encodeURIComponent(m.id)}">${esc(t('team_view_profile'))}</a></p>
    </article>`;
    })
    .join('');
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('team_title'))}</h1>
    <p class="muted public-lead">${esc(t('team_lead'))}</p>
    <div class="team-grid">${cards}</div>`,
    '/team',
  );
}

function viewTeamMember(memberId) {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return publicPageWrap(`<p class="muted">Loading…</p>`, `/team/${memberId}`);
  }
  const hasCmsTeam = !!(b && !state.cms?.error && (b.doctors || []).length);
  const team = hasCmsTeam
    ? [...(b.doctors || [])]
    : state.demo.therapists.map((t) => ({
        id: t.id,
        nameEn: t.name,
        roleEn: t.title,
        bioEn: t.bio,
        avatarMediaId: null,
        _fallbackAvatarUrl: t.avatarUrl,
        illustrationNote: `${t.licenseStatus} · ${t.availability} · ${t.email}`,
      }));
  const m = team.find((x) => x.id === memberId);
  if (!m) {
    return publicPageWrap(
      `<p class="back-link"><a href="#/team">← ${esc(t('nav_team'))}</a></p>
      <h1 class="public-h1">${esc(t('team_not_found'))}</h1>
      <p class="muted">${esc(t('team_not_found_lead'))}</p>`,
      '/team',
    );
  }
  const nameKey = lang === 'fr' ? 'nameFr' : lang === 'es' ? 'nameEs' : 'nameEn';
  const roleKey = lang === 'fr' ? 'roleFr' : lang === 'es' ? 'roleEs' : 'roleEn';
  const name = pickLocalizedText(m, 'name', lang);
  const role = pickLocalizedText(m, 'role', lang);
  const bio = pickLocalizedText(m, 'bio', lang);
  const url = hasCmsTeam ? resolveMediaUrl(b, m.avatarMediaId) : m._fallbackAvatarUrl;
  const ill = m.illustrationNote || '';
  const body = `<p class="back-link"><a href="#/team">← ${esc(t('nav_team'))}</a></p>
  <article class="team-profile card">
    ${
      url
        ? `<div class="team-profile__hero"><div class="team-profile__avatar team-profile__avatar--img"><img src="${esc(url)}" alt="" width="120" height="120" loading="eager" /></div></div>`
        : `<div class="team-profile__hero"><div class="team-profile__avatar" aria-hidden="true">${esc(name.charAt(0))}</div></div>`
    }
    <h1 class="public-h1 team-profile__h"${cmsInlinePatchAttr('doctor', m.id, nameKey)}>${esc(name)}</h1>
    <p class="team-profile__role"${cmsInlinePatchAttr('doctor', m.id, roleKey)}>${esc(role)}</p>
    <div class="team-profile__bio">${bio}</div>
    <p class="team-card__illust muted team-profile__illust"><em>${esc(ill)}</em></p>
    <p class="team-profile__actions">
      <a class="btn" href="#/book">${esc(t('nav_book'))}</a>
    </p>
  </article>`;
  return publicPageWrap(body, `/team/${memberId}`);
}

function viewBlog() {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return publicPageWrap(`<p class="muted">Loading…</p>`, '/blog');
  }
  if (!b || state.cms?.error) {
    return publicPageWrap(`<p class="error-msg">${esc(state.cms?.error || 'CMS unavailable')}</p>`, '/blog');
  }
  const posts = [...(b.blogPosts || [])].sort((a, x) =>
    (x.datePublished || '').localeCompare(a.datePublished || ''),
  );
  const titleKey = lang === 'fr' ? 'titleFr' : lang === 'es' ? 'titleEs' : 'titleEn';
  const items = posts
    .map((p) => {
      const title = pickLocalizedText(p, 'title', lang);
      const excerpt = pickLocalizedText(p, 'excerpt', lang);
      const d = p.datePublished || '';
      return `
    <article class="blog-row card">
      <time class="blog-row__date" datetime="${esc(d)}">${esc(d)}</time>
      <h3 class="blog-row__h"><span${cmsInlinePatchAttr('blogPost', p.id, titleKey)}>${esc(title)}</span></h3>
      <p class="muted">${esc(stripHtml(excerpt))}</p>
      <p><a class="btn btn--ghost" href="#/blog/${esc(p.slug)}">${esc(t('blog_read'))}</a></p>
    </article>`;
    })
    .join('');
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('blog_title'))}</h1>
    <p class="muted public-lead">${esc(t('blog_lead'))}</p>
    <div class="blog-list">${items}</div>`,
    '/blog',
  );
}

function cmsInlinePatchAttr(target, id, field) {
  if (typeof sessionStorage === 'undefined') return '';
  if (state.user?.role !== 'admin' || sessionStorage.getItem('psynova_cms_inline') === '0') return '';
  return ` data-cms-patch="${encodeURIComponent(JSON.stringify({ target, id, field }))}" class="cms-editable" tabindex="0"`;
}

function viewBlogPost(slug) {
  const lang = uiLang();
  const b = state.cms?.bundle;
  if (state.cms?.loading && !b) {
    return publicPageWrap(`<p class="muted">Loading…</p>`, '/blog');
  }
  if (!b || state.cms?.error) {
    return publicPageWrap(`<p class="error-msg">${esc(state.cms?.error || 'CMS unavailable')}</p>`, '/blog');
  }
  const post = (b.blogPosts || []).find((p) => p.slug === slug);
  if (!post) {
    return publicPageWrap(`<h1>404</h1><p class="muted">Article introuvable / Not found</p><p><a href="#/blog">${esc(t('nav_blog'))}</a></p>`, '/blog');
  }
  const body = pickLocalizedText(post, 'body', lang);
  const title = pickLocalizedText(post, 'title', lang);
  const d = post.datePublished || '';
  return publicPageWrap(
    `<p class="back-link"><a href="#/blog">← ${esc(t('nav_blog'))}</a></p>
    <article class="blog-article card">
      <time datetime="${esc(d)}">${esc(d)}</time>
      <h1 class="public-h1">${esc(title)}</h1>
      <div class="blog-article__body">${body}</div>
    </article>`,
    `/blog/${slug}`,
  );
}

function viewContact() {
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('contact_title'))}</h1>
    <p class="muted public-lead">${esc(t('contact_lead'))}</p>
    <form class="card contact-form" id="form-contact" style="max-width:520px" novalidate>
      ${formDisclaimerBlock()}
      <p class="booking-lang-prompt" lang="mul">${esc(t('booking_free_text_prompt'))}</p>
      <div class="form-row"><label for="cname">${esc(t('contact_name'))} *</label><input id="cname" name="name" class="input-wide" type="text" autocomplete="name" required maxlength="200" /></div>
      <div class="form-row"><label for="cemail">${esc(t('contact_email'))} *</label><input id="cemail" name="email" class="input-wide" type="email" autocomplete="email" required /></div>
      <div class="form-row"><label for="cmsg">${esc(t('contact_msg'))} *</label><textarea id="cmsg" name="message" class="input-textarea input-wide" rows="5" required maxlength="8000" aria-describedby="cmsg-hint"></textarea></div>
      <p id="cmsg-hint" class="muted">${esc(t('booking_notes_hint'))}</p>
      <p class="form-actions">
        <button type="button" class="btn btn--ghost" id="btn-contact-preview">${esc(t('contact_preview_translate'))}</button>
        <button type="submit" class="btn" id="btn-contact-submit">${esc(t('contact_send'))}</button>
      </p>
      <div id="contact-preview" class="contact-preview" hidden></div>
      <p id="contact-status" class="pill" role="status" hidden></p>
    </form>`,
    '/contact',
  );
}

function viewLogin() {
  return `
    <div class="main">
      ${mockupStripHtml()}
      <div class="login-lang">${langSwitcher()}</div>
      ${state.banner ? `<p class="pill" role="status">${esc(state.banner)}</p>` : ''}
      <h1>Sign in</h1>
      <form class="card" id="form-login" style="max-width:400px">
        <div class="form-row">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="username" required />
        </div>
        <div class="form-row">
          <label for="password">Password (optional for UI demo)</label>
          <input id="password" name="password" type="password" autocomplete="current-password" minlength="0" placeholder="Leave empty to open signed-in views (local preview only)" />
        </div>
        ${state.formError ? `<p class="error-msg" role="alert">${esc(state.formError)}</p>` : ''}
        <button type="submit" class="btn">Sign in</button>
        <p class="muted" style="margin-top:0.5rem;">Empty password: mock therapist session in this browser only — no API check.</p>
        <p class="muted" style="margin-top:1rem;"><a href="#/register">Create account</a> · <a href="#/">Home</a></p>
      </form>
      ${siteFooterDisclaimer()}
    </div>
  `;
}

function viewRegister() {
  return `
    <div class="main">
      ${mockupStripHtml()}
      <div class="login-lang">${langSwitcher()}</div>
      <h1>Create account</h1>
      <form class="card" id="form-register" style="max-width:400px">
        <div class="form-row">
          <label for="remail">Email</label>
          <input id="remail" name="email" type="email" required />
        </div>
        <div class="form-row">
          <label for="rpw">Password (min 8)</label>
          <input id="rpw" name="password" type="password" required minlength="8" />
        </div>
        <div class="form-row">
          <label for="role">Role</label>
          <select id="role" name="role">
            <option value="patient">Patient</option>
            <option value="clinician">Clinician</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="form-row">
          <label for="lang">Preferred language</label>
          <select id="lang" name="preferredLanguage">
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="es">Español (UI only)</option>
          </select>
        </div>
        ${state.formError ? `<p class="error-msg" role="alert">${esc(state.formError)}</p>` : ''}
        ${state.banner ? `<p class="muted">${esc(state.banner)}</p>` : ''}
        <button type="submit" class="btn">Register</button>
        <p class="muted" style="margin-top:1rem;"><a href="#/login">Sign in</a> · <a href="#/">Home</a></p>
      </form>
      ${siteFooterDisclaimer()}
    </div>
  `;
}

function viewBookPublic() {
  const signed = state.user?.sub
    ? `<p class="pill" role="status">Signed in as ${esc(state.user?.email || '')} — you can confirm your booking below.</p>`
    : '<p class="muted public-lead" style="margin-top:0">Choose a visit reason, date, and time first. You will be asked to <strong>create an account</strong> (or sign in) only on the <strong>last</strong> step to confirm the appointment (maquette / mock API).</p>';
  return publicPageWrap(
    `<h1 class="public-h1">${esc(t('nav_book'))}</h1>
    <p class="status-bar"><a href="#/">← Home</a> · <a href="#/team">${esc(t('nav_team'))}</a> · <a href="#/therapist-demo">Therapist Demo</a> · <a href="#/records-demo">Records Demo</a></p>
    ${signed}
    ${state.demo.bookingConfirmation ? `<div class="card booking-confirmation-card"><h3>Appointment confirmation</h3><p><strong>Confirmed:</strong> ${esc(state.demo.bookingConfirmation)}</p><p class="muted">DEMO / FICTIONAL confirmation state unless backend persists the record.</p></div>` : ''}
    <div class="main main--booking" style="margin-top:1rem">
      ${bookingWizardHtml(state.booking, esc, state.user, state.cms?.bundle?.services)}
    </div>
    ${state.formError ? `<p class="error-msg" role="alert" style="margin-top:1rem">${esc(state.formError)}</p>` : ''}
    <p class="muted" style="margin-top:1rem">Already use the app? <a href="#/app/appointments">Appointments (signed-in)</a> · <a href="#/login">Sign in</a></p>`,
    '/book',
  );
}

function viewDashboard() {
  const h = state.health;
  const he = state.healthError;
  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <div class="status-bar">
          <span>${esc(t('sidebar_dashboard'))}: <strong>${esc(state.user?.email || '')}</strong></span>
          <span class="pill">${esc(state.user?.role || '')}</span>
          <button type="button" class="btn btn--ghost" id="btn-logout">Log out</button>
        </div>
        <h1 style="margin-top:0;">${esc(t('sidebar_dashboard'))}</h1>
        <div class="dash-links card">
          <h2>Site (maquette)</h2>
          <p class="muted"><a href="#/services">${esc(t('nav_services'))}</a> · <a href="#/team">${esc(t('nav_team'))}</a> · <a href="#/blog">${esc(t('nav_blog'))}</a> · <a href="#/contact">${esc(t('nav_contact'))}</a></p>
          <p><a class="btn" href="#/app/appointments">${esc(t('sidebar_appts'))}</a> <a class="btn btn--ghost" href="#/therapist-demo">Therapist Demo</a> <a class="btn btn--ghost" href="#/records-demo">Records Demo</a></p>
        </div>
        <div class="card">
          <h2>Backend health</h2>
          ${
            he
              ? `<p class="error-msg">${esc(he)}</p><p class="muted">Start backend: <code>cd backend && npm run start:dev</code> or Docker.</p>`
              : `<pre style="margin:0;font-size:0.8rem;overflow:auto;">${esc(JSON.stringify(h, null, 2))}</pre>`
          }
        </div>
        <div class="gray-panel">
          <h3>Modules</h3>
          <p class="muted">Try <a href="#/app/messages">${esc(t('sidebar_messages'))}</a> · <a href="#/therapist-demo">Therapist Demo</a> · <a href="#/records-demo">Records Demo</a>. ${esc(t('sidebar_telehealth'))}, ${esc(t('sidebar_billing'))}: mock-only.</p>
        </div>
        ${siteFooterDisclaimer()}
      </div>
    </div>
  `;
}

function apptCategoryCell(a) {
  const lang = uiLang();
  const slug = a.serviceCategory;
  if (!slug) return '—';
  const svc = state.cms?.bundle?.services?.find((s) => s.slug === slug);
  if (svc) return esc(pickLocalizedText(svc, 'title', lang));
  const cat = getCategoryById(slug);
  return esc(cat ? categoryLabel(cat, lang) : slug);
}

function viewAppointments() {
  const apiRows =
    state.appointments?.items?.length > 0
      ? state.appointments.items
          .map(
            (a) =>
              `<tr><td>${esc(a.id.slice(0, 8))}…</td><td>${apptCategoryCell(a)}</td><td><span class="status-pill status-pill--${esc(String(a.status || '').toLowerCase())}">${esc(a.status)}</span></td><td>${esc(a.startsAt)}</td><td>${esc(a.endsAt)}</td><td class="muted">${a.sessionNotesOriginal ? esc(a.sessionNotesOriginal.slice(0, 48)) + (a.sessionNotesOriginal.length > 48 ? '…' : '') : '—'}</td><td class="muted">API</td></tr>`,
          )
          .join('')
      : '';
  const demoRows = state.demo.appointments
    .map((a) => {
      const patient = state.demo.patients.find((p) => p.id === a.patientId);
      return `<tr>
        <td>${esc(a.id)}</td>
        <td>${esc(a.service)}</td>
        <td><span class="status-pill status-pill--${esc(a.status)}">${esc(a.status)}</span></td>
        <td>${esc(a.startsAt)}</td>
        <td>${esc(a.sessionType)}</td>
        <td class="muted">${esc(patient?.name || 'Demo patient')}</td>
        <td><button type="button" class="btn btn--small btn--ghost" data-demo-appt-confirm="${esc(a.id)}">Confirm</button> <button type="button" class="btn btn--small btn--ghost" data-demo-appt-cancel="${esc(a.id)}">Cancel</button></td>
      </tr>`;
    })
    .join('');
  const rows = `${demoRows}${apiRows}` || `<tr><td colspan="7" class="muted">No rows yet — use the booking wizard above.</td></tr>`;

  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main main--booking" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← Dashboard</a> · <a href="#/therapist-demo">Therapist Demo</a> · <a href="#/records-demo">Records Demo</a></p>
        <h1 style="margin-top:0;">Appointments</h1>
        <p class="muted" style="margin-top:0;">DRAFT booking: category → date → time → session details → confirm. Original implementation; not a third-party theme.</p>
        ${state.demo.bookingConfirmation ? `<p class="pill">Appointment confirmed (demo): ${esc(state.demo.bookingConfirmation)}</p>` : ''}
        ${state.listError ? `<p class="error-msg">${esc(state.listError)}</p>` : ''}
        ${bookingWizardHtml(state.booking, esc, state.user, state.cms?.bundle?.services)}
        ${state.formError ? `<p class="error-msg" role="alert">${esc(state.formError)}</p>` : ''}
        <div class="card">
          <h2>Your appointments (DEMO / FICTIONAL + API)</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Category/Service</th><th>Status</th><th>Starts</th><th>Ends/Type</th><th>Notes/Patient</th><th>Actions</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        ${siteFooterDisclaimer()}
      </div>
    </div>
  `;
}

function viewGray(title, blurb) {
  return `
    <div class="layout">
      ${shellSidebar(!!state.user)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← Dashboard</a></p>
        <h1 style="margin-top:0;">${esc(title)}</h1>
        <div class="gray-panel" aria-disabled="true">
          <h3>Not connected</h3>
          <p>${esc(blurb)}</p>
          <p class="muted">UI placeholder for human review — no API route in this build.</p>
        </div>
        ${siteFooterDisclaimer()}
      </div>
    </div>
  `;
}

function viewSettings() {
  const lang = localStorage.getItem('psynova_ui_lang') || 'en';
  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← Dashboard</a></p>
        <h1 style="margin-top:0;">Settings</h1>
        <div class="card">
          <h2>Interface language (local only)</h2>
          <p class="muted">Does not change server profile in this draft build.</p>
          <div class="form-row">
            <label for="uilang">UI language</label>
            <select id="uilang">
              <option value="fr" ${lang === 'fr' ? 'selected' : ''}>Français</option>
              <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
              <option value="es" ${lang === 'es' ? 'selected' : ''}>Español</option>
            </select>
          </div>
          <button type="button" class="btn" id="btn-save-lang">Save</button>
        </div>
        ${siteFooterDisclaimer()}
      </div>
    </div>
  `;
}

function viewLegal() {
  const L = uiLang();
  const content = `
        <h1 class="public-h1">${esc(t('legal_title'))}</h1>
        <div class="legal-stack">${legalPageHtml(L)}</div>
        <p class="muted"><a href="#/">${esc(t('back_home'))}</a></p>`;
  if (state.user) {
    return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← ${esc(t('sidebar_dashboard'))}</a></p>
        ${content}
        ${siteFooterDisclaimer()}
      </div>
    </div>`;
  }
  return publicPageWrap(content, '/legal');
}

function viewCms() {
  const ok = state.user?.role === 'admin';
  const inner = ok
    ? `<h1 class="public-h1">CMS</h1>
       <p class="muted">Multilingual content, media uploads, preview/publish without redeploy.</p>
       ${viewCmsAdmin(state, esc)}`
    : `<h1>403</h1><p class="muted">Admin only.</p>`;
  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← ${esc(t('sidebar_dashboard'))}</a></p>
        ${inner}
        ${siteFooterDisclaimer()}
      </div>
    </div>`;
}

function viewAdmin() {
  const ok = state.user?.role === 'admin';
  const inner = ok
    ? `<h1 class="public-h1">${esc(t('admin_title'))}</h1>
       <p class="muted">${esc(t('admin_lead'))}</p>
       <p><a class="btn" href="#/app/cms">Open content CMS</a></p>
       <div class="admin-grid">
         <div class="card admin-stat"><h3>Patients (fictif)</h3><p class="admin-stat__n">12</p></div>
         <div class="card admin-stat"><h3>Rendez-vous (7 j)</h3><p class="admin-stat__n">28</p></div>
         <div class="card admin-stat"><h3>Journal</h3><p class="admin-stat__n muted" style="font-size:0.85rem;">audit mock — vide</p></div>
       </div>`
    : `<h1>403</h1><p class="muted">Réservé au rôle admin (démo).</p>`;
  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← ${esc(t('sidebar_dashboard'))}</a></p>
        ${inner}
        ${siteFooterDisclaimer()}
      </div>
    </div>`;
}

function viewMessagesMock() {
  const L = uiLang();
  const them =
    L === 'fr'
      ? 'Bonjour, rappel : votre séance de démo est confirmée (fictif).'
      : L === 'es'
        ? 'Hola: tu cita de demostración está confirmada (ficticia).'
        : 'Hello: your demo session is confirmed (fictional).';
  const me =
    L === 'fr'
      ? 'Merci, je confirmais la réception (maquette).'
      : L === 'es'
        ? 'Gracias, acuso recibo (maqueta).'
        : 'Thanks — acknowledged (mockup).';
  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← ${esc(t('sidebar_dashboard'))}</a></p>
        <h1 style="margin-top:0;">${esc(t('msgs_title'))}</h1>
        <p class="muted">${esc(t('msgs_lead'))}</p>
        <div class="msg-thread card">
          <div class="msg-bubble msg-bubble--them"><span class="msg-bubble__who">Clinicien·ne (fictif)</span>${esc(them)}</div>
          <div class="msg-bubble msg-bubble--me"><span class="msg-bubble__who">Vous</span>${esc(me)}</div>
        </div>
        ${siteFooterDisclaimer()}
      </div>
    </div>`;
}

function demoTherapistById(id) {
  return state.demo.therapists.find((t) => t.id === id);
}

function triggerDownload(filename, mime, text) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function viewTherapistDemo() {
  const primary = state.demo.therapists[0];
  const appts = state.demo.appointments
    .map((a) => {
      const p = state.demo.patients.find((x) => x.id === a.patientId);
      return `<tr>
        <td>${esc(a.id)}</td>
        <td>${esc(p?.name || 'Demo patient')}</td>
        <td>${esc(a.service)}</td>
        <td>${esc(a.startsAt)}</td>
        <td><span class="status-pill status-pill--${esc(a.status)}">${esc(a.status)}</span></td>
        <td><button type="button" class="btn btn--small btn--ghost" data-demo-appt-confirm="${esc(a.id)}">Confirm</button> <button type="button" class="btn btn--small btn--ghost" data-demo-appt-cancel="${esc(a.id)}">Cancel</button></td>
      </tr>`;
    })
    .join('');
  const patients = state.demo.patients
    .map((p) => {
      const th = demoTherapistById(p.therapistId);
      return `<tr>
        <td>${esc(p.name)}</td>
        <td>${esc(String(p.age))}</td>
        <td>${esc(th?.name || p.therapistId)}</td>
        <td>${esc(p.upcomingAppointment)}</td>
        <td><span class="status-pill status-pill--${esc(p.status)}">${esc(p.status)}</span></td>
        <td class="muted">${esc(p.tags.join(', '))}</td>
      </tr>`;
    })
    .join('');
  const msgs = state.demo.messages
    .map(
      (m) =>
        `<article class="msg-item card"><h4>${esc(m.subject)} <span class="status-pill ${m.unread ? 'status-pill--pending' : 'status-pill--confirmed'}">${m.unread ? 'Unread' : 'Read'}</span></h4><p class="muted">${esc(m.from)} → ${esc(m.to)} · ${esc(m.time)}</p><p>${esc(m.preview)}</p><p><button type="button" class="btn btn--small btn--ghost" data-demo-reply="${esc(m.id)}">Reply</button></p></article>`,
    )
    .join('');
  const emails = state.demo.emails
    .map(
      (e) =>
        `<tr><td>${esc(e.type)}</td><td>${esc(e.recipient)}</td><td><span class="status-pill status-pill--${esc(e.status)}">${esc(e.status)}</span></td><td>${esc(e.time)}</td></tr>`,
    )
    .join('');
  return publicPageWrap(
    `<h1 class="public-h1">Therapist Demo Workspace</h1>
    <p class="muted public-lead">DEMO / FICTIONAL data only. Use to test patient, therapist, messages, email activity, records and appointment confirmation workflows.</p>
    <p class="status-bar"><a href="#/">← Home</a> · <a href="#/book">Book</a> · <a href="#/team">Therapists</a> · <a href="#/records-demo">Records Demo</a></p>
    <section class="card therapist-demo-profile">
      <img class="therapist-demo-profile__img" src="${esc(primary.avatarUrl)}" alt="" width="108" height="108" />
      <div>
        <h2>${esc(primary.name)}</h2>
        <p class="muted">${esc(primary.title)}</p>
        <p><strong>Specialties:</strong> ${esc(primary.specialties.join(', '))}</p>
        <p><strong>Languages:</strong> ${esc(primary.languages.join(', '))}</p>
        <p><strong>Availability:</strong> ${esc(primary.availability)}</p>
        <p class="muted">${esc(primary.licenseStatus)} · ${esc(primary.email)} · ${esc(primary.phone)}</p>
      </div>
    </section>
    <div class="demo-grid">
      <section class="card">
        <h2>Appointments</h2>
        <p class="muted">Confirm/Cancel updates local demo state only.</p>
        <div class="table-wrap"><table><thead><tr><th>ID</th><th>Patient</th><th>Service</th><th>When</th><th>Status</th><th>Action</th></tr></thead><tbody>${appts}</tbody></table></div>
      </section>
      <section class="card">
        <h2>Patients</h2>
        <div class="table-wrap"><table><thead><tr><th>Name</th><th>Age</th><th>Therapist</th><th>Upcoming</th><th>Status</th><th>Tags</th></tr></thead><tbody>${patients}</tbody></table></div>
      </section>
    </div>
    <section class="card">
      <h2>Messages Inbox</h2>
      <div class="msg-list">${msgs}</div>
    </section>
    <section class="card">
      <h2>Email activity</h2>
      <div class="table-wrap"><table><thead><tr><th>Type</th><th>Recipient</th><th>Status</th><th>Timestamp</th></tr></thead><tbody>${emails}</tbody></table></div>
    </section>`,
    '/therapist-demo',
  );
}

function viewRecordsDemo() {
  const rows = state.demo.records
    .map(
      (r) =>
        `<tr><td>${esc(r.patient)}</td><td>${esc(r.therapist)}</td><td>${esc(r.date)}</td><td>${esc(r.type)}</td><td><span class="status-pill status-pill--${esc(r.status)}">${esc(r.status)}</span></td><td>${esc(r.summary)}</td><td><button type="button" class="btn btn--small btn--ghost" data-demo-view-record="${esc(r.id)}">View</button> <button type="button" class="btn btn--small btn--ghost" data-demo-export-record="${esc(r.id)}" data-format="csv">Export CSV</button> <button type="button" class="btn btn--small btn--ghost" data-demo-export-record="${esc(r.id)}" data-format="json">Export JSON</button></td></tr>`,
    )
    .join('');
  return publicPageWrap(
    `<h1 class="public-h1">Records Demo</h1>
    <p class="muted public-lead">DEMO / FICTIONAL records only. Export actions generate frontend downloads using Blob (no backend).</p>
    <p class="status-bar"><a href="#/therapist-demo">← Therapist Demo</a> · <a href="#/">Home</a> · <a href="#/book">Book</a></p>
    <section class="card">
      <h2>Patient records table</h2>
      <div class="table-wrap"><table><thead><tr><th>Patient</th><th>Therapist</th><th>Date</th><th>Type</th><th>Status</th><th>Summary</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </section>`,
    '/records-demo',
  );
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// BOOKING_FLOW_RESTORE_START — specialty cards (Services page) open `#/book` with pre-filled category; no PHI stored here.
function onServiceCardOpenBooking(e) {
  if (e.target.closest('[data-cms-patch], .cms-editable')) return;
  const card = e.target.closest('.service-card[data-booking-category]');
  if (!card || e.target.closest('.booking-wizard')) return;
  e.preventDefault();
  const slug = card.getAttribute('data-booking-category') || '';
  if (!slug) return;
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(SS_BOOKING);
  } catch {
    /* */
  }
  state.booking = { ...defaultBookingState(), categoryId: slug, step: 2 };
  navigate('/book');
}
// BOOKING_FLOW_RESTORE_END

/** Single delegation on #app — avoids duplicate listeners on each render(). */
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
    if (state.booking.categoryId) state.booking.step = 2;
    render();
    return;
  }

  if (t.id === 'booking-next-cat' && state.booking.categoryId) {
    state.booking.step = 2;
    render();
    return;
  }
  if (t.id === 'booking-back-home') {
    navigate('/services');
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
  state.formError = null;
  if (!state.user?.sub) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SS_BOOKING, JSON.stringify(state.booking));
        sessionStorage.setItem(SS_RETURN, '/book');
      }
    } catch {
      /* full storage */
    }
    state.banner =
      'Sign in (or create an account from the sign-in page) to confirm this slot — your choices are kept for this browser session only.';
    navigate('/login');
    return;
  }
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
    });
    clearBookingHandoff();
    await refreshAppointments();
    state.demo.bookingConfirmation = `${state.booking.dateStr} ${state.booking.timeStr} · ${state.booking.sessionType}`;
    state.booking = defaultBookingState();
    render();
  } catch (err) {
    // If backend is unavailable, keep a local demo appointment so end-to-end UI can be tested.
    state.demo.appointments.unshift({
      id: `apt-demo-${Date.now().toString().slice(-6)}`,
      therapistId: state.demo.therapists[0]?.id || 'th-01',
      patientId: state.demo.patients[0]?.id || 'pt-01',
      service: state.booking.categoryId || 'General consult',
      startsAt: `${state.booking.dateStr} ${state.booking.timeStr}`,
      sessionType: state.booking.sessionType,
      status: 'pending',
    });
    state.demo.bookingConfirmation = `${state.booking.dateStr} ${state.booking.timeStr} · ${state.booking.sessionType} (local demo fallback)`;
    state.formError = `API unavailable; saved as local demo appointment. ${err.body?.message || err.message}`;
    render();
  }
}

function render() {
  state.route = routeFromHash();
  const r = state.route;
  const authed = !!(getToken() && state.user);
  let html = '';

  if (r === '/' || r === '') {
    html = viewLanding();
  } else if (r === '/about') {
    html = viewAbout();
  } else if (r === '/services') {
    html = viewServices();
  } else if (r === '/team') {
    html = viewTeam();
  } else if (r.startsWith('/team/')) {
    let tid = r.slice('/team/'.length);
    try {
      tid = decodeURIComponent(tid);
    } catch {
      /* keep raw */
    }
    html = viewTeamMember(tid);
  } else if (r === '/therapist-demo') {
    html = viewTherapistDemo();
  } else if (r === '/records-demo') {
    html = viewRecordsDemo();
  } else if (r === '/blog') {
    html = viewBlog();
  } else if (r.startsWith('/blog/')) {
    html = viewBlogPost(r.replace(/^\/blog\//, ''));
  } else if (r === '/contact') {
    html = viewContact();
  } else if (r === '/login') {
    html = viewLogin();
  } else if (r === '/register') {
    html = viewRegister();
  } else if (r === '/book') {
    html = viewBookPublic();
  } else if (r === '/legal') {
    html = viewLegal();
  } else if (r.startsWith('/app')) {
    if (!authed) {
      html = viewLogin();
    } else if (r === '/app' || r === '/app/') {
      html = viewDashboard();
    } else if (r === '/app/appointments') {
      html = viewAppointments();
    } else if (r === '/app/messages') {
      html = viewMessagesMock();
    } else if (r === '/app/admin') {
      html = viewAdmin();
    } else if (r === '/app/cms') {
      html = viewCms();
    } else if (r === '/app/telehealth') {
      html = viewGray('Telehealth', 'Video session scheduling and Zoom Healthcare integration are not wired.');
    } else if (r === '/app/billing') {
      html = viewGray('Billing', 'Stripe and insurance-ready invoicing are not wired.');
    } else if (r === '/app/ehr') {
      html = viewGray('Clinical records', 'EHR storage and charting are not wired.');
    } else if (r === '/app/clinician') {
      html = viewGray('Clinician workspace', 'Separate clinician tools require additional endpoints and roles.');
    } else if (r === '/app/settings') {
      html = viewSettings();
    } else {
      html = viewGray('Page', 'Unknown route.');
    }
  } else {
    html = viewGray('Not found', 'Unknown path.');
  }

  const root = document.getElementById('app');
  root.innerHTML = html;
  bind();
}

function bind() {
  document.getElementById('form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.formError = null;
    const fd = new FormData(e.target);
    const email = (fd.get('email') && String(fd.get('email')).trim()) || '';
    const password = (fd.get('password') && String(fd.get('password'))) || '';
    if (!email) {
      state.formError = 'Email is required.';
      render();
      return;
    }
    if (!password) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('psynova_demo_email', email);
      }
      setToken(PSYNOVA_DEMO_UI_TOKEN);
      await refreshUser();
      state.banner = null;
      state.formError = null;
      let next = null;
      try {
        next = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SS_RETURN) : null;
        if (next && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SS_RETURN);
        }
      } catch {
        /* */
      }
      navigate(next || '/app');
      return;
    }
    try {
      if (getToken() === PSYNOVA_DEMO_UI_TOKEN) setToken(null);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('psynova_demo_email');
      }
      await login({
        email,
        password,
      });
      await refreshUser();
      state.banner = null;
      state.formError = null;
      let next = null;
      try {
        next = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SS_RETURN) : null;
        if (next && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(SS_RETURN);
        }
      } catch {
        /* */
      }
      navigate(next || '/app');
    } catch (err) {
      state.formError = err.body?.message || err.message;
      render();
    }
  });

  document.getElementById('form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.formError = null;
    const fd = new FormData(e.target);
    try {
      await register({
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
        preferredLanguage: fd.get('preferredLanguage'),
      });
      state.banner = 'Account created. Sign in with the same password.';
      navigate('/login');
    } catch (err) {
      state.formError = Array.isArray(err.body?.message)
        ? err.body.message.join(', ')
        : err.body?.message || err.message;
      render();
    }
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (getToken() === PSYNOVA_DEMO_UI_TOKEN) {
      setToken(null);
      if (typeof localStorage !== 'undefined') localStorage.removeItem('psynova_demo_email');
    } else {
      try {
        await logout();
      } catch {
        /* still clear client */
      }
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem('psynova_demo_email');
    state.user = null;
    navigate('/');
  });

  document.getElementById('btn-save-lang')?.addEventListener('click', () => {
    const sel = document.getElementById('uilang');
    if (sel) setUiLang(sel.value);
    state.banner = 'Saved locally.';
    render();
  });

  document.getElementById('psynova-lang')?.addEventListener('change', (e) => {
    const v = e.target && e.target.value;
    if (v) setUiLang(v);
    render();
  });

  document.getElementById('btn-disable-inline')?.addEventListener('click', () => {
    sessionStorage.setItem('psynova_cms_inline', '0');
    render();
  });

  const navMenu = document.getElementById('public-nav-menu');
  const closePublicNav = () => {
    const nav = document.querySelector('.public-nav--bar');
    nav?.classList.remove('public-nav--open');
    const btn = document.getElementById('public-nav-menu');
    btn?.setAttribute('aria-expanded', 'false');
  };
  navMenu?.addEventListener('click', (e) => {
    e.preventDefault();
    const nav = e.currentTarget?.closest?.('.public-nav--bar');
    if (!nav) return;
    const open = !nav.classList.contains('public-nav--open');
    nav.classList.toggle('public-nav--open', open);
    e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.getElementById('public-nav-links')?.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"]')) closePublicNav();
  });

  document.getElementById('btn-contact-preview')?.addEventListener('click', async () => {
    const ta = document.getElementById('cmsg');
    const prev = document.getElementById('contact-preview');
    if (!ta || !prev) return;
    prev.hidden = false;
    prev.innerHTML = `<p class="muted">${esc(t('contact_preview_loading'))}</p>`;
    try {
      const data = await translateText(ta.value, uiLang());
      prev.innerHTML = '';
      const h = document.createElement('h4');
      h.className = 'contact-preview__h';
      h.textContent = t('contact_preview_title');
      prev.appendChild(h);
      const p = document.createElement('p');
      p.textContent = data.translatedText || '';
      prev.appendChild(p);
      const m = document.createElement('p');
      m.className = 'muted';
      m.textContent = `${t('contact_preview_provider')}: ${data.provider || '—'}`;
      prev.appendChild(m);
    } catch (err) {
      prev.innerHTML = `<p class="error-msg">${esc(err.message || String(err))}</p>`;
    }
  });

  document.getElementById('form-contact')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cname')?.value?.trim();
    const email = document.getElementById('cemail')?.value?.trim();
    const message = document.getElementById('cmsg')?.value?.trim();
    const st = document.getElementById('contact-status');
    if (!name || !email || !message) {
      if (st) {
        st.hidden = false;
        st.textContent = t('validation_required');
      }
      return;
    }
    if (st) {
      st.hidden = false;
      st.textContent = t('contact_submitting');
    }
    try {
      await submitContact({
        name,
        email,
        message,
        clientLanguage: uiLang(),
      });
      if (st) st.textContent = t('contact_ok');
    } catch (err) {
      if (st) st.textContent = err.message || t('contact_error');
    }
  });

  if (state.route === '/app/cms' && state.user?.role === 'admin') {
    void bindCmsAdmin({ state, render, esc });
  }
}

async function onCmsInlineClick(e) {
  const el = e.target.closest('[data-cms-patch]');
  if (!el || state.user?.role !== 'admin') return;
  e.preventDefault();
  e.stopPropagation();
  let raw = el.getAttribute('data-cms-patch');
  if (!raw) return;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }
  const { target, id, field } = parsed;
  const cur = el.textContent?.trim() || '';
  const next = window.prompt('Edit value', cur);
  if (next == null) return;
  try {
    await cmsPatchField({ target, id, field, value: next });
    await loadCms();
    render();
  } catch (err) {
    window.alert(err.message || String(err));
  }
}

function onAppClickDemo(e) {
  const confirmBtn = e.target.closest('[data-demo-appt-confirm]');
  if (confirmBtn) {
    const id = confirmBtn.getAttribute('data-demo-appt-confirm');
    const row = state.demo.appointments.find((a) => a.id === id);
    if (row) {
      row.status = 'confirmed';
      state.demo.bookingConfirmation = `${row.id} · ${row.startsAt}`;
      render();
    }
    return;
  }
  const cancelBtn = e.target.closest('[data-demo-appt-cancel]');
  if (cancelBtn) {
    const id = cancelBtn.getAttribute('data-demo-appt-cancel');
    const row = state.demo.appointments.find((a) => a.id === id);
    if (row) {
      row.status = 'cancelled';
      render();
    }
    return;
  }
  const replyBtn = e.target.closest('[data-demo-reply]');
  if (replyBtn) {
    const id = replyBtn.getAttribute('data-demo-reply');
    window.alert(`Demo reply composer for ${id} (mock only).`);
    return;
  }
  const viewRecBtn = e.target.closest('[data-demo-view-record]');
  if (viewRecBtn) {
    const id = viewRecBtn.getAttribute('data-demo-view-record');
    const rec = state.demo.records.find((r) => r.id === id);
    if (rec) {
      window.alert(`Record ${rec.id}\nPatient: ${rec.patient}\nSummary: ${rec.summary}\n\nDEMO / FICTIONAL`);
    }
    return;
  }
  const exportRecBtn = e.target.closest('[data-demo-export-record]');
  if (exportRecBtn) {
    const id = exportRecBtn.getAttribute('data-demo-export-record');
    const format = exportRecBtn.getAttribute('data-format') || 'json';
    const rec = state.demo.records.find((r) => r.id === id);
    if (!rec) return;
    if (format === 'csv') {
      const csv = `id,patient,therapist,date,type,status,summary\n${[
        rec.id,
        rec.patient,
        rec.therapist,
        rec.date,
        rec.type,
        rec.status,
        rec.summary.replace(/,/g, ';'),
      ].join(',')}\n`;
      triggerDownload(`${rec.id}.csv`, 'text/csv;charset=utf-8', csv);
    } else {
      triggerDownload(`${rec.id}.json`, 'application/json;charset=utf-8', JSON.stringify(rec, null, 2));
    }
  }
}

export async function init() {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.addEventListener('click', onServiceCardOpenBooking);
    appRoot.addEventListener('click', onAppClickBooking);
    appRoot.addEventListener('click', onAppClickDemo);
    appRoot.addEventListener('submit', onAppSubmitBooking);
    appRoot.addEventListener('click', onCmsInlineClick);
  }
  window.addEventListener('hashchange', () => {
    void routeChange();
  });
  await routeChange();
}

async function routeChange() {
  state.route = routeFromHash();
  if (state.route === '/book') {
    mergeBookingFromSession();
  }
  state.formError = null;
  await refreshUser();
  await refreshHealth();
  await loadCms();
  const r = state.route;
  if (state.user && (r === '/app/appointments' || r === '/app')) {
    await refreshAppointments();
  }
  render();
}
