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
};

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
    ${item('/blog', 'nav_blog')}
    ${item('/contact', 'nav_contact')}
    ${item('/book', 'nav_book')}
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
    .map((c) => {
      const title = c.title?.[lang] || c.title?.en || '';
      const blurb = c.blurb?.[lang] || c.blurb?.en || '';
      const href = c.href || '#';
      return `<a class="home-card" href="${esc(href)}"><h3>${esc(title)}</h3><p class="muted">${esc(blurb)}</p></a>`;
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
      <div class="hero hero--wide" id="main">
        <h1>${esc(hero.title)}</h1>
        <div class="muted hero__lead">${hero.lead}</div>
        <p class="hero__actions">
          <a class="btn" href="${esc(hero.ctaPrimary?.href || '#/register')}">${esc(hero.ctaPrimary?.label || '')}</a>
          <a class="btn btn--ghost" href="${esc(hero.ctaSecondary?.href || '#/legal')}">${esc(hero.ctaSecondary?.label || '')}</a>
          <a class="btn btn--ghost" href="${esc(hero.ctaBook?.href || '#/book')}">${esc(hero.ctaBook?.label || '')}</a>
        </p>
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
    .map((s) => {
      const title = pickLocalizedText(s, 'title', lang);
      const body = pickLocalizedText(s, 'body', lang);
      // BOOKING_FLOW_RESTORE: actionable specialty → opens `#/book` with category prefilled (see `onServiceCardOpenBooking`)
      return `<button type="button" class="service-card" data-booking-category="${esc(s.slug)}" aria-label="${esc(title)} — ${esc(t('nav_book'))}">
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
  if (!b || state.cms?.error) {
    return publicPageWrap(`<p class="error-msg">${esc(state.cms?.error || 'CMS unavailable')}</p>`, '/team');
  }
  const team = [...(b.doctors || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const nameKey = lang === 'fr' ? 'nameFr' : lang === 'es' ? 'nameEs' : 'nameEn';
  const roleKey = lang === 'fr' ? 'roleFr' : lang === 'es' ? 'roleEs' : 'roleEn';
  const cards = team
    .map((m) => {
      const name = pickLocalizedText(m, 'name', lang);
      const role = pickLocalizedText(m, 'role', lang);
      const bio = pickLocalizedText(m, 'bio', lang);
      const url = resolveMediaUrl(b, m.avatarMediaId);
      const ill = m.illustrationNote || '';
      return `
    <article class="team-card">
      ${
        url
          ? `<div class="team-card__avatar team-card__avatar--img"><img src="${esc(url)}" alt="" width="96" height="96" loading="lazy" /></div>`
          : `<div class="team-card__avatar" aria-hidden="true">${esc(name.charAt(0))}</div>`
      }
      <h3 class="team-card__name"${cmsInlinePatchAttr('doctor', m.id, nameKey)}>${esc(name)}</h3>
      <p class="team-card__role"${cmsInlinePatchAttr('doctor', m.id, roleKey)}>${esc(role)}</p>
      <div class="team-card__bio">${bio}</div>
      <p class="team-card__illust muted"><em>${esc(ill)}</em></p>
      <p class="team-card__cta"><a class="btn btn--ghost" href="#/team/${encodeURIComponent(m.id)}">${esc(t('team_view_profile'))}</a></p>
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
  if (!b || state.cms?.error) {
    return publicPageWrap(
      `<p class="error-msg">${esc(state.cms?.error || 'CMS unavailable')}</p>`,
      `/team/${memberId}`,
    );
  }
  const team = [...(b.doctors || [])];
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
  const url = resolveMediaUrl(b, m.avatarMediaId);
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
    ${signed}
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
          <p><a class="btn" href="#/app/appointments">${esc(t('sidebar_appts'))}</a></p>
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
          <p class="muted">Try <a href="#/app/messages">${esc(t('sidebar_messages'))}</a>. ${esc(t('sidebar_telehealth'))}, ${esc(t('sidebar_billing'))}: not wired.</p>
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
  const rows =
    state.appointments?.items?.length > 0
      ? state.appointments.items
          .map(
            (a) =>
              `<tr><td>${esc(a.id.slice(0, 8))}…</td><td>${apptCategoryCell(a)}</td><td>${esc(a.status)}</td><td>${esc(a.startsAt)}</td><td>${esc(a.endsAt)}</td><td class="muted">${a.sessionNotesOriginal ? esc(a.sessionNotesOriginal.slice(0, 48)) + (a.sessionNotesOriginal.length > 48 ? '…' : '') : '—'}</td></tr>`,
          )
          .join('')
      : `<tr><td colspan="6" class="muted">No rows yet — use the booking wizard above.</td></tr>`;

  return `
    <div class="layout">
      ${shellSidebar(true)}
      <div class="main main--booking" id="main">
        ${mockupStripHtml()}
        <p class="status-bar"><a href="#/app">← Dashboard</a></p>
        <h1 style="margin-top:0;">Appointments</h1>
        <p class="muted" style="margin-top:0;">DRAFT booking: category → date → time → session details → confirm. Original implementation; not a third-party theme.</p>
        ${state.listError ? `<p class="error-msg">${esc(state.listError)}</p>` : ''}
        ${bookingWizardHtml(state.booking, esc, state.user, state.cms?.bundle?.services)}
        ${state.formError ? `<p class="error-msg" role="alert">${esc(state.formError)}</p>` : ''}
        <div class="card">
          <h2>Your appointments</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Category</th><th>Status</th><th>Starts</th><th>Ends</th><th>Notes (demo)</th></tr></thead>
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
    state.booking = defaultBookingState();
    render();
  } catch (err) {
    state.formError = err.body?.message || err.message;
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

export async function init() {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    appRoot.addEventListener('click', onServiceCardOpenBooking);
    appRoot.addEventListener('click', onAppClickBooking);
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
