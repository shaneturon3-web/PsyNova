# FRONTEND BUNDLE

Paths relative to `AI_STUDIO_RECOVERY_BUNDLE/`.

===== FILE: app/frontend/.env.example =====

```dotenv
# Optional: full API URL (skip Vite proxy). Default is same-origin /api.
# VITE_API_BASE=http://127.0.0.1:3000/api

# Optional: proxy target for vite.config.js (dev/preview only).
# VITE_PROXY_TARGET=http://127.0.0.1:3000
```

===== FILE: app/frontend/index.html =====

```html
<!doctype html>
<html lang="fr-CA">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Maquette PsyNova — aucune donnée réelle. Mockup — no real data."
    />
    <title>PsyNova Virtual Clinic — maquette</title>
  </head>
  <body>
    <div class="maquette-banner" role="banner" aria-label="Prototype notice">
      <p class="maquette-banner__line maquette-banner__line--primary">
        <span lang="en">This is a mockup</span>
        <span class="maquette-banner__sep" aria-hidden="true"> / </span>
        <span lang="fr">Ceci est une maquette</span>
        <span class="maquette-banner__sep" aria-hidden="true"> / </span>
        <span lang="es">Esto es un prototipo</span>
        <span class="maquette-banner__dash" aria-hidden="true"> – </span>
        <span lang="mul">no real services or data</span>
      </p>
      <p class="maquette-banner__sub">
        <span lang="fr">Ne constitue pas un avis médical ou psychologique · aucune relation thérapeutique · démo seulement</span>
        <span class="maquette-banner__sep" aria-hidden="true">·</span>
        <span lang="en">Not medical or psychological advice · no therapeutic relationship · demo only</span>
        <span class="maquette-banner__sep" aria-hidden="true">·</span>
        <span lang="es">No es consejo médico ni psicológico · sin relación terapéutica · solo demo</span>
      </p>
    </div>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

===== FILE: app/frontend/package.json =====

```json
{
  "name": "psynova-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite --host 0.0.0.0 --port 5173",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0 --port 5173"
  },
  "devDependencies": {
    "vite": "^5.4.10"
  }
}
```

===== FILE: app/frontend/src/api.js =====

```javascript
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
```

===== FILE: app/frontend/src/app.js =====

```javascript
import {
  getToken,
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
      currentPath === path || (path === '/blog' && currentPath.startsWith('/blog/'))
        ? ' public-nav__a--current'
        : '';
    return `<a class="public-nav__a${cur}" href="#${path}">${esc(t(key))}</a>`;
  };
  return `<nav class="public-nav public-nav--bar" aria-label="Site">
    ${item('/', 'nav_home')}
    ${item('/about', 'nav_about')}
    ${item('/services', 'nav_services')}
    ${item('/team', 'nav_team')}
    ${item('/blog', 'nav_blog')}
    ${item('/contact', 'nav_contact')}
    <span class="public-nav__sp" aria-hidden="true"></span>
    ${langSwitcher()}
    <a class="public-nav__a" href="/api/docs" target="_blank" rel="noreferrer">${esc(t('nav_api'))}</a>
    ${item('/login', 'nav_login')}
    ${item('/register', 'nav_register')}
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
          <a class="btn btn--ghost" href="${esc(hero.ctaBook?.href || '#/login')}">${esc(hero.ctaBook?.label || '')}</a>
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
      return `<div class="service-card"><h3 class="service-card__h"${cmsInlinePatchAttr('service', s.id, titleKey)}>${esc(title)}</h3><div class="muted service-card__p">${body}</div></div>`;
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
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required minlength="8" />
        </div>
        ${state.formError ? `<p class="error-msg" role="alert">${esc(state.formError)}</p>` : ''}
        <button type="submit" class="btn">Sign in</button>
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
  state.formError = null;
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
    try {
      await login({
        email: fd.get('email'),
        password: fd.get('password'),
      });
      await refreshUser();
      state.banner = null;
      state.formError = null;
      navigate('/app');
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
    try {
      await logout();
    } catch {
      /* still clear client */
    }
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
```

===== FILE: app/frontend/src/booking-wizard.js =====

```javascript
/**
 * Multi-step booking: category → calendar → time → session → confirm.
 * Pattern inspired by public service-booking sites; implementation is original.
 * Status: DRAFT (not production-final copy or clinical intake).
 */

import { pickLocalizedText, stripHtml } from './cms-util.js';
import { formDisclaimerBlock } from './disclaimers.js';
import { t, uiLang } from './i18n.js';
import { DRAFT_SERVICE_CATEGORIES, categoryBlurb, categoryLabel } from './service-categories.js';

function tx(fr, en, es) {
  const l = uiLang();
  if (l === 'es') return es;
  if (l === 'fr') return fr;
  return en;
}

const SLOT_STEP_MIN = 30;
const DAY_START_H = 9;
const DAY_END_H = 17;

export function defaultBookingState() {
  const n = new Date();
  return {
    step: 1,
    categoryId: '',
    dateStr: '',
    timeStr: '',
    sessionType: 'video',
    notes: '',
    calYear: n.getFullYear(),
    calMonth: n.getMonth(),
  };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatLocalYMD(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function buildTimeSlots() {
  const slots = [];
  for (let h = DAY_START_H; h < DAY_END_H; h++) {
    for (const m of [0, 30]) {
      if (h === DAY_END_H - 1 && m === 30) break;
      slots.push(`${pad2(h)}:${m === 0 ? '00' : '30'}`);
    }
  }
  return slots;
}

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function calendarGridHtml(year, month, selectedDateStr, esc) {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = formatLocalYMD(new Date());
  const cells = [];

  for (let i = 0; i < startPad; i++) {
    cells.push('<td class="cal__pad"></td>');
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const isPast = ds < today;
    const sel = ds === selectedDateStr ? ' cal__day--selected' : '';
    if (isPast) {
      cells.push(
        `<td><button type="button" class="cal__day cal__day--disabled" disabled aria-disabled="true">${d}</button></td>`,
      );
    } else {
      cells.push(
        `<td><button type="button" class="cal__day${sel}" data-booking-date="${esc(ds)}">${d}</button></td>`,
      );
    }
  }

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(`<tr>${cells.slice(i, i + 7).join('')}</tr>`);
  }

  const head = `<tr>${WD.map((w) => `<th scope="col">${w}</th>`).join('')}</tr>`;
  return `<table class="cal" role="grid" aria-label="Select date"><thead>${head}</thead><tbody>${rows.join('')}</tbody></table>`;
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * @param {object} booking
 * @param {function} esc
 * @param {'fr'|'en'|'es'} lang
 * @param {object[] | null | undefined} cmsServices — from CMS bundle (slug, title*, body*)
 */
function categoryCardsHtml(booking, esc, lang, cmsServices) {
  if (cmsServices?.length) {
    const sorted = [...cmsServices].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted
      .map((s) => {
        const cid = s.slug;
        const sel = booking.categoryId === cid ? ' category-card--selected' : '';
        const title = esc(pickLocalizedText(s, 'title', lang));
        const blurb = esc(stripHtml(pickLocalizedText(s, 'body', lang)).slice(0, 280));
        return `<button type="button" class="category-card${sel}" data-booking-category="${esc(cid)}" aria-pressed="${booking.categoryId === cid ? 'true' : 'false'}">
      <span class="category-card__title">${title}</span>
      <span class="category-card__blurb">${blurb}</span>
    </button>`;
      })
      .join('');
  }
  return DRAFT_SERVICE_CATEGORIES.map((cat) => {
    const sel = booking.categoryId === cat.id ? ' category-card--selected' : '';
    const title = esc(categoryLabel(cat, lang));
    const blurb = esc(categoryBlurb(cat, lang));
    return `<button type="button" class="category-card${sel}" data-booking-category="${esc(cat.id)}" aria-pressed="${booking.categoryId === cat.id ? 'true' : 'false'}">
      <span class="category-card__title">${title}</span>
      <span class="category-card__blurb">${blurb}</span>
    </button>`;
  }).join('');
}

/**
 * @param {object} booking
 * @param {function} esc
 * @param {object} user - auth /me payload
 * @param {object[] | null | undefined} cmsServices — optional CMS services for category step
 */
export function bookingWizardHtml(booking, esc, user, cmsServices) {
  const slots = buildTimeSlots();
  const step = booking.step;
  const ml = monthLabel(booking.calYear, booking.calMonth);
  const lang = uiLang();

  const stepper = `
    <ol class="booking-steps" aria-label="${tx('Progression', 'Progress', 'Progreso')}">
      <li class="booking-steps__i ${step >= 1 ? 'booking-steps__i--on' : ''}"><span>1</span> ${tx('Motif', 'Reason', 'Motivo')}</li>
      <li class="booking-steps__i ${step >= 2 ? 'booking-steps__i--on' : ''}"><span>2</span> ${tx('Date', 'Date', 'Fecha')}</li>
      <li class="booking-steps__i ${step >= 3 ? 'booking-steps__i--on' : ''}"><span>3</span> ${tx('Heure', 'Time', 'Hora')}</li>
      <li class="booking-steps__i ${step >= 4 ? 'booking-steps__i--on' : ''}"><span>4</span> ${tx('Séance', 'Session', 'Sesión')}</li>
      <li class="booking-steps__i ${step >= 5 ? 'booking-steps__i--on' : ''}"><span>5</span> ${tx('Confirmer', 'Confirm', 'Confirmar')}</li>
    </ol>`;

  let body = '';

  if (step === 1) {
    body = `
      <div class="booking-panel booking-panel--wide">
        ${formDisclaimerBlock()}
        <p class="booking-lead">${tx(
          'Choisissez le motif principal de la consultation (liste provisoire DRAFT).',
          'Choose the main reason for your visit (DRAFT list — not clinical intake).',
          'Elija el motivo principal (lista DRAFT — no es evaluación clínica).',
        )}</p>
        <div class="category-grid" role="group" aria-label="${tx('Motif', 'Service category', 'Motivo')}">${categoryCardsHtml(booking, esc, lang, cmsServices)}</div>
        <div class="booking-actions">
          <button type="button" class="btn" id="booking-next-cat" ${booking.categoryId ? '' : 'disabled'}>${tx('Suivant', 'Next', 'Siguiente')}</button>
        </div>
      </div>`;
  } else if (step === 2) {
    body = `
      <div class="booking-panel">
        ${formDisclaimerBlock()}
        <p class="booking-lead">${tx(
          'Choisissez un jour (fuseau Montréal).',
          'Pick a day (Montreal-time scheduling).',
          'Elija un día (horario Montreal).',
        )}</p>
        <div class="cal-toolbar">
          <button type="button" class="btn btn--ghost" id="booking-cal-prev" aria-label="${tx('Mois précédent', 'Previous month', 'Mes anterior')}">←</button>
          <span class="cal-toolbar__title">${esc(ml)}</span>
          <button type="button" class="btn btn--ghost" id="booking-cal-next" aria-label="${tx('Mois suivant', 'Next month', 'Mes siguiente')}">→</button>
        </div>
        ${calendarGridHtml(booking.calYear, booking.calMonth, booking.dateStr, esc)}
        <p class="muted">${tx('Sélection', 'Selected', 'Selección')}: <strong>${booking.dateStr ? esc(booking.dateStr) : '—'}</strong></p>
        <div class="booking-actions">
          <button type="button" class="btn btn--ghost" id="booking-back-2">${tx('Retour', 'Back', 'Atrás')}</button>
          <button type="button" class="btn" id="booking-next-1" ${booking.dateStr ? '' : 'disabled'}>${tx('Suivant', 'Next', 'Siguiente')}</button>
        </div>
      </div>`;
  } else if (step === 3) {
    const slotButtons = slots
      .map(
        (slot) =>
          `<button type="button" class="slot-btn${slot === booking.timeStr ? ' slot-btn--selected' : ''}" data-booking-time="${esc(slot)}">${esc(slot)}</button>`,
      )
      .join('');
    body = `
      <div class="booking-panel">
        ${formDisclaimerBlock()}
        <p class="muted">${tx('Date', 'Date', 'Fecha')}: <strong>${esc(booking.dateStr)}</strong></p>
        <p class="booking-lead">${tx('Heure de début', 'Start time', 'Hora de inicio')} (${SLOT_STEP_MIN} min).</p>
        <div class="slot-grid" role="group" aria-label="${tx('Créneaux', 'Time slots', 'Horarios')}">${slotButtons}</div>
        <div class="booking-actions">
          <button type="button" class="btn btn--ghost" id="booking-back-3">${tx('Retour', 'Back', 'Atrás')}</button>
          <button type="button" class="btn" id="booking-next-2" ${booking.timeStr ? '' : 'disabled'}>${tx('Suivant', 'Next', 'Siguiente')}</button>
        </div>
      </div>`;
  } else if (step === 4) {
    body = `
      <div class="booking-panel">
        ${formDisclaimerBlock()}
        <p class="muted">${esc(booking.dateStr)} · ${esc(booking.timeStr)}</p>
        <div class="form-row">
          <label>${tx('Format', 'Format', 'Formato')}</label>
          <div class="radio-row">
            <label><input type="radio" name="sessionType" value="video" ${booking.sessionType === 'video' ? 'checked' : ''} /> ${tx('Vidéo', 'Video', 'Video')}</label>
            <label><input type="radio" name="sessionType" value="in_person" ${booking.sessionType === 'in_person' ? 'checked' : ''} /> ${tx('En personne', 'In person', 'Presencial')}</label>
            <label><input type="radio" name="sessionType" value="phone" ${booking.sessionType === 'phone' ? 'checked' : ''} /> ${tx('Téléphone', 'Phone', 'Teléfono')}</label>
          </div>
        </div>
        <p class="booking-lang-prompt" lang="mul">${esc(t('booking_free_text_prompt'))}</p>
        <div class="form-row">
          <label for="booking-notes">${tx('Notes (optionnel, démo)', 'Notes (optional, demo)', 'Notas (opcional, demo)')}</label>
          <textarea id="booking-notes" name="notes" rows="4" class="input-textarea" maxlength="8000" aria-describedby="booking-notes-hint">${esc(booking.notes)}</textarea>
        </div>
        <p id="booking-notes-hint" class="muted">${esc(t('booking_notes_hint'))}</p>
        <p class="muted">${esc(user?.email || '')} · ${tx('Langue UI', 'UI language', 'Idioma UI')}: ${esc(lang)}</p>
        <div class="booking-actions">
          <button type="button" class="btn btn--ghost" id="booking-back-4">${tx('Retour', 'Back', 'Atrás')}</button>
          <button type="button" class="btn" id="booking-next-3">${tx('Suivant', 'Next', 'Siguiente')}</button>
        </div>
      </div>`;
  } else {
    const durMin = 50;
    const fmt =
      booking.sessionType === 'in_person'
        ? tx('En personne', 'In person', 'Presencial')
        : booking.sessionType === 'phone'
          ? tx('Téléphone', 'Phone', 'Teléfono')
          : tx('Vidéo', 'Video', 'Video');
    let catLine = booking.categoryId || '—';
    if (cmsServices?.length) {
      const s = cmsServices.find((x) => x.slug === booking.categoryId);
      if (s) catLine = pickLocalizedText(s, 'title', lang);
    } else {
      const cat = DRAFT_SERVICE_CATEGORIES.find((c) => c.id === booking.categoryId);
      catLine = cat ? categoryLabel(cat, lang) : catLine;
    }
    body = `
      <div class="booking-panel">
        ${formDisclaimerBlock()}
        <h3 class="booking-confirm__title">${tx('Confirmer la réservation', 'Confirm booking', 'Confirmar reserva')}</h3>
        <ul class="booking-summary">
          <li><strong>${tx('Motif', 'Reason', 'Motivo')}:</strong> ${esc(catLine)}</li>
          <li><strong>${tx('Quand', 'When', 'Cuándo')}:</strong> ${esc(booking.dateStr)} ${tx('à', 'at', 'a')} ${esc(booking.timeStr)} (${durMin} min)</li>
          <li><strong>${tx('Format', 'Format', 'Formato')}:</strong> ${esc(fmt)}</li>
          <li><strong>${tx('Notes', 'Notes', 'Notas')}:</strong> ${booking.notes ? esc(booking.notes) : '—'}</li>
        </ul>
        <p class="muted">${tx('Crée une demande', 'Creates a', 'Crea una solicitud')} <code>pending</code> ${tx('via l’API (maquette).', 'appointment via API (mockup).', 'por API (maqueta).')}</p>
        <form id="form-appt-booking">
          <div class="booking-actions">
            <button type="button" class="btn btn--ghost" id="booking-back-5">${tx('Retour', 'Back', 'Atrás')}</button>
            <button type="submit" class="btn" id="booking-submit">${tx('Confirmer', 'Confirm & book', 'Confirmar')}</button>
          </div>
        </form>
      </div>`;
  }

  return `
    <section class="booking-wizard booking-wizard--draft" aria-labelledby="booking-wizard-title">
      <div class="booking-draft-badge" role="status">DRAFT</div>
      <h2 id="booking-wizard-title" class="booking-wizard__h">${tx('Prendre rendez-vous', 'Book a session', 'Reservar cita')}</h2>
      <p class="booking-wizard__sub">${tx(
        'Motif → date → heure → détails → confirmation. Maquette sans valeur clinique.',
        'Category → date → time → details → confirm. Mockup — not clinical intake.',
        'Motivo → fecha → hora → detalles → confirmación. Maqueta sin valor clínico.',
      )}</p>
      ${stepper}
      ${body}
    </section>`;
}
```

===== FILE: app/frontend/src/cms-admin-panel.js =====

```javascript
import {
  cmsDeleteHomeSection,
  cmsPatchField,
  cmsUpsertHomeSection,
  cmsUploadDoctorAvatar,
  cmsUploadTestimonialAvatar,
  fetchCmsBundle,
} from './cms-api.js';

function ensureQuill() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Quill) {
      resolve();
      return;
    }
    if (typeof document === 'undefined') {
      reject(new Error('no document'));
      return;
    }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Quill load failed'));
    document.head.appendChild(s);
  });
}

/**
 * @param {object} state — app state with cms bundle
 * @param {function} esc
 */
export function viewCmsAdmin(state, esc) {
  const b = state.cms?.bundle;
  const err = state.cms?.error;
  if (!b && err) {
    return `<p class="error-msg">CMS: ${esc(err)}</p>`;
  }
  if (!b) {
    return `<p class="muted">Loading CMS…</p>`;
  }

  const enc = (s) => encodeURIComponent(s || '');
  const doctors = [...(b.doctors || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const doctorForms = doctors
    .map((d) => {
      const q = (name) =>
        `<label class="cms-lbl">${esc(name)}<textarea class="input-textarea cms-quill-target" name="${esc(name)}" rows="6" data-enc="${enc(d[name] || '')}"></textarea></label>`;
      return `<section class="card cms-card"><h3>${esc(d.slug)}</h3>
        <div class="cms-grid">
          <label>nameFr <input class="input-wide" name="nameFr" value="${esc(d.nameFr || '')}" /></label>
          <label>nameEn <input class="input-wide" name="nameEn" value="${esc(d.nameEn || '')}" /></label>
          <label>nameEs <input class="input-wide" name="nameEs" value="${esc(d.nameEs || '')}" /></label>
          <label>roleFr <input class="input-wide" name="roleFr" value="${esc(d.roleFr || '')}" /></label>
          <label>roleEn <input class="input-wide" name="roleEn" value="${esc(d.roleEn || '')}" /></label>
          <label>roleEs <input class="input-wide" name="roleEs" value="${esc(d.roleEs || '')}" /></label>
        </div>
        ${q('bioFr')}
        ${q('bioEn')}
        ${q('bioEs')}
        <label>illustration_note <input class="input-wide" name="illustrationNote" value="${esc(d.illustrationNote || '')}" /></label>
        <label><input type="checkbox" name="published" ${d.published ? 'checked' : ''} /> published</label>
        <p><input type="file" accept="image/*" name="avatar" class="cms-file" /> Replace cartoon avatar (upload)</p>
        <button type="button" class="btn cms-save-doctor" data-id="${esc(d.id)}">Save doctor</button>
      </section>`;
    })
    .join('');

  const services = [...(b.services || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const serviceForms = services
    .map(
      (s) => `
    <section class="card cms-card"><h3>${esc(s.slug)}</h3>
      <div class="cms-grid">
        <label>titleFr <input class="input-wide" name="titleFr" value="${esc(s.titleFr || '')}" /></label>
        <label>titleEn <input class="input-wide" name="titleEn" value="${esc(s.titleEn || '')}" /></label>
        <label>titleEs <input class="input-wide" name="titleEs" value="${esc(s.titleEs || '')}" /></label>
      </div>
      <label>bodyFr <textarea class="input-textarea cms-quill-target" name="bodyFr" rows="4" data-enc="${enc(s.bodyFr || '')}"></textarea></label>
      <label>bodyEn <textarea class="input-textarea cms-quill-target" name="bodyEn" rows="4" data-enc="${enc(s.bodyEn || '')}"></textarea></label>
      <label>bodyEs <textarea class="input-textarea cms-quill-target" name="bodyEs" rows="4" data-enc="${enc(s.bodyEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${s.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-service" data-id="${esc(s.id)}">Save service</button>
    </section>`,
    )
    .join('');

  const testimonials = [...(b.testimonials || [])].sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0));
  const testimonialForms = testimonials
    .map(
      (t) => `
    <section class="card cms-card"><h3>${esc(t.id.slice(0, 8))}…</h3>
      <div class="cms-grid">
        <label>authorFr <input class="input-wide" name="authorFr" value="${esc(t.authorFr || '')}" /></label>
        <label>authorEn <input class="input-wide" name="authorEn" value="${esc(t.authorEn || '')}" /></label>
        <label>authorEs <input class="input-wide" name="authorEs" value="${esc(t.authorEs || '')}" /></label>
      </div>
      <label>quoteFr <textarea class="input-textarea cms-quill-target" name="quoteFr" rows="3" data-enc="${enc(t.quoteFr || '')}"></textarea></label>
      <label>quoteEn <textarea class="input-textarea cms-quill-target" name="quoteEn" rows="3" data-enc="${enc(t.quoteEn || '')}"></textarea></label>
      <label>quoteEs <textarea class="input-textarea cms-quill-target" name="quoteEs" rows="3" data-enc="${enc(t.quoteEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${t.published ? 'checked' : ''} /> published</label>
      <p><input type="file" accept="image/*" name="avatar" class="cms-file" /> Replace avatar</p>
      <button type="button" class="btn cms-save-testimonial" data-id="${esc(t.id)}">Save testimonial</button>
    </section>`,
    )
    .join('');

  const homeRows = [...(b.homeSections || [])]
    .sort((a, x) => (a.sortOrder ?? 0) - (x.sortOrder ?? 0))
    .map(
      (h) => `
    <section class="card cms-card">
      <h3>${esc(h.sectionType)} · ${esc(h.id.slice(0, 8))}…</h3>
      <label>sortOrder <input type="number" name="sortOrder" value="${esc(String(h.sortOrder))}" /></label>
      <label>sectionType <input class="input-wide" name="sectionType" value="${esc(h.sectionType)}" /></label>
      <label>payload (JSON) <textarea class="input-textarea" name="payload" rows="10">${esc(JSON.stringify(h.payload || {}, null, 2))}</textarea></label>
      <label><input type="checkbox" name="published" ${h.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-home" data-id="${esc(h.id)}">Save section</button>
      <button type="button" class="btn btn--ghost cms-del-home" data-id="${esc(h.id)}">Remove section</button>
    </section>`,
    )
    .join('');

  const posts = [...(b.blogPosts || [])].map(
    (p) => `
    <section class="card cms-card"><h3>${esc(p.slug)}</h3>
      <label>datePublished <input name="datePublished" value="${esc(p.datePublished || '')}" /></label>
      <div class="cms-grid">
        <label>titleFr <input class="input-wide" name="titleFr" value="${esc(p.titleFr || '')}" /></label>
        <label>titleEn <input class="input-wide" name="titleEn" value="${esc(p.titleEn || '')}" /></label>
        <label>titleEs <input class="input-wide" name="titleEs" value="${esc(p.titleEs || '')}" /></label>
      </div>
      <label>excerptFr <textarea name="excerptFr" rows="2" class="input-textarea">${esc(p.excerptFr || '')}</textarea></label>
      <label>excerptEn <textarea name="excerptEn" rows="2" class="input-textarea">${esc(p.excerptEn || '')}</textarea></label>
      <label>excerptEs <textarea name="excerptEs" rows="2" class="input-textarea">${esc(p.excerptEs || '')}</textarea></label>
      <label>bodyFr <textarea class="cms-quill-target" name="bodyFr" rows="6" data-enc="${enc(p.bodyFr || '')}"></textarea></label>
      <label>bodyEn <textarea class="cms-quill-target" name="bodyEn" rows="6" data-enc="${enc(p.bodyEn || '')}"></textarea></label>
      <label>bodyEs <textarea class="cms-quill-target" name="bodyEs" rows="6" data-enc="${enc(p.bodyEs || '')}"></textarea></label>
      <label><input type="checkbox" name="published" ${p.published ? 'checked' : ''} /> published</label>
      <button type="button" class="btn cms-save-blog" data-id="${esc(p.id)}">Save post</button>
    </section>`,
  );

  return `
    <div class="cms-admin">
      <p class="muted">${esc(b.tag || '')}</p>
      <div class="cms-toolbar card">
        <button type="button" class="btn" id="cms-reload">Reload from API</button>
        <label class="cms-inline"><input type="checkbox" id="cms-preview-drafts" /> Preview drafts (admin session)</label>
        <label class="cms-inline"><input type="checkbox" id="cms-inline-edit" /> Human script correction (click-to-edit on public pages)</label>
        <p class="muted" style="margin:0;">Rich text: Save converts WYSIWYG (Quill) to HTML. No redeploy — data lives in API/DB.</p>
      </div>
      <div class="cms-tabs" role="tablist">
        <button type="button" class="btn btn--ghost cms-tab" data-tab="doctors">Doctors</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="services">Services</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="testimonials">Testimonials</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="home">Home sections</button>
        <button type="button" class="btn btn--ghost cms-tab" data-tab="blog">Blog</button>
      </div>
      <div id="cms-panel-doctors" class="cms-panel">${doctorForms}</div>
      <div id="cms-panel-services" class="cms-panel" hidden>${serviceForms}</div>
      <div id="cms-panel-testimonials" class="cms-panel" hidden>${testimonialForms}</div>
      <div id="cms-panel-home" class="cms-panel" hidden>
        ${homeRows}
        <section class="card"><h3>Add section</h3>
          <label>sortOrder <input type="number" id="cms-new-home-sort" value="99" /></label>
          <label>sectionType <input id="cms-new-home-type" value="richtext" /></label>
          <label>payload JSON <textarea id="cms-new-home-payload" rows="6" class="input-textarea">{}</textarea></label>
          <button type="button" class="btn" id="cms-add-home">Add section</button>
        </section>
      </div>
      <div id="cms-panel-blog" class="cms-panel" hidden>${posts.join('')}</div>
    </div>`;
}

function closestCard(el) {
  return el && el.closest && el.closest('.cms-card');
}

function readDoctorCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    nameFr: get('nameFr')?.value ?? '',
    nameEn: get('nameEn')?.value ?? '',
    nameEs: get('nameEs')?.value ?? '',
    roleFr: get('roleFr')?.value ?? '',
    roleEn: get('roleEn')?.value ?? '',
    roleEs: get('roleEs')?.value ?? '',
    illustrationNote: get('illustrationNote')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readServiceCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    titleFr: get('titleFr')?.value ?? '',
    titleEn: get('titleEn')?.value ?? '',
    titleEs: get('titleEs')?.value ?? '',
    bodyFr: get('bodyFr')?.value ?? '',
    bodyEn: get('bodyEn')?.value ?? '',
    bodyEs: get('bodyEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readTestimonialCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    authorFr: get('authorFr')?.value ?? '',
    authorEn: get('authorEn')?.value ?? '',
    authorEs: get('authorEs')?.value ?? '',
    quoteFr: get('quoteFr')?.value ?? '',
    quoteEn: get('quoteEn')?.value ?? '',
    quoteEs: get('quoteEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

function readBlogCard(card) {
  const get = (n) => card.querySelector(`[name="${n}"]`);
  return {
    datePublished: get('datePublished')?.value ?? '',
    titleFr: get('titleFr')?.value ?? '',
    titleEn: get('titleEn')?.value ?? '',
    titleEs: get('titleEs')?.value ?? '',
    excerptFr: get('excerptFr')?.value ?? '',
    excerptEn: get('excerptEn')?.value ?? '',
    excerptEs: get('excerptEs')?.value ?? '',
    bodyFr: get('bodyFr')?.value ?? '',
    bodyEn: get('bodyEn')?.value ?? '',
    bodyEs: get('bodyEs')?.value ?? '',
    published: get('published')?.checked ?? false,
  };
}

/**
 * @param {object} ctx — { state, render, esc }
 */
export async function bindCmsAdmin(ctx) {
  const { state, render } = ctx;
  const root = document.querySelector('.cms-admin');
  if (!root) return;

  const mapTab = {
    doctors: 'cms-panel-doctors',
    services: 'cms-panel-services',
    testimonials: 'cms-panel-testimonials',
    home: 'cms-panel-home',
    blog: 'cms-panel-blog',
  };

  root.querySelectorAll('.cms-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      Object.values(mapTab).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      });
      if (tab && mapTab[tab]) {
        const p = document.getElementById(mapTab[tab]);
        if (p) p.hidden = false;
      }
    });
  });

  document.getElementById('cms-reload')?.addEventListener('click', async () => {
    state.cms.loading = true;
    render();
    try {
      const preview =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem('psynova_cms_preview') === '1';
      state.cms.bundle = await fetchCmsBundle({ preview });
      state.cms.error = null;
    } catch (e) {
      state.cms.error = e.message || String(e);
    } finally {
      state.cms.loading = false;
      render();
      void bindCmsAdmin(ctx);
    }
  });

  const prev = document.getElementById('cms-preview-drafts');
  if (prev) {
    prev.checked = sessionStorage.getItem('psynova_cms_preview') === '1';
    prev.addEventListener('change', () => {
      if (prev.checked) sessionStorage.setItem('psynova_cms_preview', '1');
      else sessionStorage.removeItem('psynova_cms_preview');
    });
  }
  const inl = document.getElementById('cms-inline-edit');
  if (inl) {
    inl.checked = sessionStorage.getItem('psynova_cms_inline') !== '0';
    inl.addEventListener('change', () => {
      if (inl.checked) sessionStorage.setItem('psynova_cms_inline', '1');
      else sessionStorage.setItem('psynova_cms_inline', '0');
    });
  }

  try {
    await ensureQuill();
    root.querySelectorAll('textarea.cms-quill-target').forEach((ta) => {
      const host = document.createElement('div');
      host.className = 'cms-quill';
      host.style.minHeight = '120px';
      ta.parentNode.insertBefore(host, ta);
      ta.hidden = true;
      let html = '';
      try {
        const encv = ta.getAttribute('data-enc');
        html = encv ? decodeURIComponent(encv) : ta.value || '';
      } catch {
        html = '';
      }
      const q = new window.Quill(host, { theme: 'snow', modules: { toolbar: true } });
      q.clipboard.dangerouslyPasteHTML(html);
      ta.__quill = q;
    });
  } catch {
    /* textarea fallback */
  }

  const getQuillHtml = (ta) => {
    if (ta?.__quill) return ta.__quill.root.innerHTML;
    return ta?.value ?? '';
  };

  root.querySelectorAll('.cms-save-doctor').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readDoctorCard(card);
      const fileInp = card.querySelector('input.cms-file');
      const file = fileInp && fileInp.files && fileInp.files[0];
      try {
        if (file) await cmsUploadDoctorAvatar(id, file);
        for (const [k, v] of Object.entries(data)) {
          await cmsPatchField({ target: 'doctor', id, field: k, value: v });
        }
        for (const name of ['bioFr', 'bioEn', 'bioEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'doctor', id, field: name, value: html });
        }
        alert('Doctor saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-service').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readServiceCard(card);
      try {
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('body')) continue;
          await cmsPatchField({ target: 'service', id, field: k, value: v });
        }
        for (const name of ['bodyFr', 'bodyEn', 'bodyEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'service', id, field: name, value: html });
        }
        alert('Service saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-testimonial').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readTestimonialCard(card);
      const fileInp = card.querySelector('input.cms-file');
      const file = fileInp && fileInp.files && fileInp.files[0];
      try {
        if (file) await cmsUploadTestimonialAvatar(id, file);
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('quote')) continue;
          await cmsPatchField({ target: 'testimonial', id, field: k, value: v });
        }
        for (const name of ['quoteFr', 'quoteEn', 'quoteEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'testimonial', id, field: name, value: html });
        }
        alert('Testimonial saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-save-home').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const sortOrder = Number(card.querySelector('[name="sortOrder"]')?.value || 0);
      const sectionType = card.querySelector('[name="sectionType"]')?.value || 'richtext';
      const published = card.querySelector('[name="published"]')?.checked ?? false;
      let payload = {};
      try {
        payload = JSON.parse(card.querySelector('[name="payload"]')?.value || '{}');
      } catch {
        alert('Invalid JSON payload');
        return;
      }
      try {
        await cmsUpsertHomeSection({ id, sortOrder, sectionType, payload, published });
        alert('Home section saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  root.querySelectorAll('.cms-del-home').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!id || !confirm('Delete this homepage section?')) return;
      try {
        await cmsDeleteHomeSection(id);
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });

  document.getElementById('cms-add-home')?.addEventListener('click', async () => {
    const sortOrder = Number(document.getElementById('cms-new-home-sort')?.value || 0);
    const sectionType = document.getElementById('cms-new-home-type')?.value || 'richtext';
    let payload = {};
    try {
      payload = JSON.parse(document.getElementById('cms-new-home-payload')?.value || '{}');
    } catch {
      alert('Invalid JSON');
      return;
    }
    try {
      await cmsUpsertHomeSection({ sortOrder, sectionType, payload, published: false });
      state.cms.bundle = await fetchCmsBundle({
        preview: sessionStorage.getItem('psynova_cms_preview') === '1',
      });
      render();
      void bindCmsAdmin(ctx);
    } catch (e) {
      alert(e.message || String(e));
    }
  });

  root.querySelectorAll('.cms-save-blog').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = closestCard(btn);
      if (!id || !card) return;
      const data = readBlogCard(card);
      try {
        for (const [k, v] of Object.entries(data)) {
          if (k.startsWith('body')) continue;
          const field = k === 'datePublished' ? 'datePublished' : k;
          await cmsPatchField({ target: 'blogPost', id, field, value: v });
        }
        for (const name of ['bodyFr', 'bodyEn', 'bodyEs']) {
          const ta = card.querySelector(`textarea[name="${name}"]`);
          const html = getQuillHtml(ta);
          await cmsPatchField({ target: 'blogPost', id, field: name, value: html });
        }
        alert('Blog post saved.');
        state.cms.bundle = await fetchCmsBundle({
          preview: sessionStorage.getItem('psynova_cms_preview') === '1',
        });
        render();
        void bindCmsAdmin(ctx);
      } catch (e) {
        alert(e.message || String(e));
      }
    });
  });
}
```

===== FILE: app/frontend/src/cms-api.js =====

```javascript
import { API_BASE, getToken } from './api.js';

/**
 * @param {{ preview?: boolean }} opts
 * Preview mode includes drafts when the user is admin and `preview` is true.
 */
export async function fetchCmsBundle(opts = {}) {
  const preview = !!opts.preview;
  const params = new URLSearchParams();
  if (preview) params.set('preview', '1');
  const headers = {};
  if (preview && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  const q = params.toString();
  const res = await fetch(`${API_BASE}/cms/bundle${q ? `?${q}` : ''}`, {
    headers,
    credentials: 'omit',
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'CMS request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * @param {object} body — { target, id, field, value }
 */
export async function cmsPatchField(body) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/patch-field`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'PATCH failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function cmsUpsertHomeSection(body) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/home-sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Save failed');
  return data;
}

export async function cmsDeleteHomeSection(id) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/cms/admin/home-sections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Delete failed');
  }
  return res.json().catch(() => ({}));
}

/**
 * @param {string} doctorId
 * @param {File} file
 */
export async function cmsUploadDoctorAvatar(doctorId, file) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/cms/admin/doctors/${encodeURIComponent(doctorId)}/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
  return data;
}

/**
 * @param {string} testimonialId
 * @param {File} file
 */
export async function cmsUploadTestimonialAvatar(testimonialId, file) {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(
    `${API_BASE}/cms/admin/testimonials/${encodeURIComponent(testimonialId)}/avatar`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || 'Upload failed');
  return data;
}
```

===== FILE: app/frontend/src/cms-util.js =====

```javascript
import { API_BASE } from './api.js';

/** @param {string} html */
export function stripHtml(html) {
  if (!html) return '';
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * @param {object} row — e.g. doctor with nameFr, nameEn, nameEs
 * @param {string} prefix — e.g. 'name'
 * @param {'fr'|'en'|'es'} lang
 */
export function pickLocalizedText(row, prefix, lang) {
  const fr = row[`${prefix}Fr`];
  const en = row[`${prefix}En`];
  const es = row[`${prefix}Es`];
  if (lang === 'fr') return fr || en || es || '';
  if (lang === 'es') return es || en || fr || '';
  return en || fr || es || '';
}

/**
 * @param {object} bundle — CMS bundle with media[]
 * @param {string | null | undefined} mediaId
 */
export function resolveMediaUrl(bundle, mediaId) {
  if (!mediaId || !bundle?.media) return null;
  const m = bundle.media.find((x) => x.id === mediaId);
  if (!m) return null;
  if (m.publicUrl) return m.publicUrl;
  return `${API_BASE}/cms/media/${m.id}/file`;
}

/**
 * @param {object} payload — hero payload with title.lead.cta*
 * @param {'fr'|'en'|'es'} lang
 */
export function heroPick(payload, lang) {
  const L = (o) => (o && (o[lang] || o.en || o.fr || o.es)) || '';
  return {
    title: L(payload.title),
    lead: L(payload.lead),
    ctaPrimary: payload.ctaPrimary
      ? { label: L(payload.ctaPrimary.label), href: payload.ctaPrimary.href || '#' }
      : null,
    ctaSecondary: payload.ctaSecondary
      ? { label: L(payload.ctaSecondary.label), href: payload.ctaSecondary.href || '#' }
      : null,
    ctaBook: payload.ctaBook
      ? { label: L(payload.ctaBook.label), href: payload.ctaBook.href || '#' }
      : null,
  };
}
```

===== FILE: app/frontend/src/disclaimers.js =====

```javascript
import { MOCKUP_BANNER_PRIMARY } from './mockup-banner.js';
import { t } from './i18n.js';

/** Compact strip for in-app shell (canonical Phase 1 line). */
export function mockupStripHtml() {
  return `<div class="mockup-strip" role="status" data-mockup-banner="${escapeAttr(MOCKUP_BANNER_PRIMARY)}">
    <span lang="en">This is a mockup</span>
    <span class="mockup-strip__sep" aria-hidden="true"> / </span>
    <span lang="fr">Ceci est une maquette</span>
    <span class="mockup-strip__sep" aria-hidden="true"> / </span>
    <span lang="es">Esto es un prototipo</span>
    <span class="mockup-strip__sep" aria-hidden="true"> – </span>
    <span lang="mul">no real services or data</span>
  </div>`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Near form inputs: mockup + non-clinical + crisis. */
export function formDisclaimerBlock() {
  return `<aside class="form-disclaimer" aria-label="${t('disclaimer_aria')}">
    <p class="form-disclaimer__mockup"><strong>${t('disclaimer_banner_line')}</strong></p>
    <p class="form-disclaimer__title">${t('disclaimer_form_title')}</p>
    <p class="form-disclaimer__p">${t('disclaimer_form_p1')}</p>
    <p class="form-disclaimer__p">${t('disclaimer_form_p2')}</p>
    <p class="form-disclaimer__crisis">${t('disclaimer_crisis')}</p>
  </aside>`;
}

/** Shown once at top of public inner content (supplements fixed header banner). */
export function globalContentDisclaimer() {
  return `<div class="content-disclaimer card card--disclaimer">
    <p class="content-disclaimer__line"><strong>${t('disclaimer_banner_line')}</strong></p>
    <p class="content-disclaimer__line"><strong>${t('disclaimer_short')}</strong></p>
    <p class="muted content-disclaimer__sub">${t('disclaimer_detail')}</p>
  </div>`;
}

/** Site footer on public pages (supplements header banner). */
export function siteFooterDisclaimer() {
  return `<footer class="site-footer-disclaimer" role="contentinfo">
    <p class="site-footer-disclaimer__mockup"><strong>${t('disclaimer_banner_line')}</strong></p>
    <p class="site-footer-disclaimer__text">${t('footer_disclaimer')}</p>
  </footer>`;
}
```

===== FILE: app/frontend/src/i18n.js =====

```javascript
/** UI strings FR / EN / ES — maquette PsyNova */

const STR = {
  fr: {
    nav_home: 'Accueil',
    nav_about: 'À propos',
    nav_services: 'Services',
    nav_team: 'Équipe',
    nav_blog: 'Blogue',
    nav_contact: 'Contact',
    nav_login: 'Connexion',
    nav_register: 'Créer un compte',
    nav_api: 'API',
    nav_book: 'Prendre rendez-vous',
    home_title: 'Clinique virtuelle de psychologie — Montréal',
    home_lead:
      'Accompagnement psychologique téléphonique et en visioconférence. Maquette à des fins de démonstration — aucun service clinique réel.',
    home_cta_register: 'Créer un compte fictif',
    home_cta_legal: 'Avis légaux',
    about_title: 'À propos de PsyNova (fictif)',
    about_p1:
      'PsyNova est un **scénario de produit** pour une clinique virtuelle québécoise. Les textes, noms et parcours sont imaginaires et cohérents avec une exigence éthique (Ordre des psychologues du Québec, Loi 25 — à valider juridiquement avant toute utilisation publique).',
    about_p2:
      'Aucune adresse réelle, aucune promesse de résultat, aucune urgence traitée par ce site : en cas de crise, composez le 911 ou la ligne 988 (Canada).',
    services_title: 'Services (maquette)',
    services_lead: 'Les catégories ci-dessous relient le formulaire de réservation une fois connecté.',
    team_title: 'Équipe — personnages fictifs',
    team_lead:
      'Illustrations décrites comme cartoon professionnel (pastel doux, semi-plat). Aucune photo réelle ; noms inventés.',
    blog_title: 'Blogue — articles fictifs',
    blog_lead: 'Contenus pédagogiques d’exemple, adaptés au contexte montréalais.',
    blog_read: 'Lire',
    contact_title: 'Contact (simulation)',
    contact_lead: 'Ce formulaire n’envoie pas de courriel réel. Utilisation réservée à la démo.',
    contact_name: 'Nom',
    contact_email: 'Courriel',
    contact_msg: 'Message',
    contact_send: 'Envoyer (maquette)',
    contact_sent: 'Non envoyé — maquette sans backend courriel.',
    legal_title: 'Avis légaux et éthique (brouillon)',
    admin_title: 'Tableau de bord admin (simulation)',
    admin_lead: 'Données agrégées fictives. Réservé au rôle admin en démo.',
    msgs_title: 'Messagerie sécurisée (simulée)',
    msgs_lead: 'Fil fictif entre patient et clinicien — aucune persistance clinique.',
    back_home: '← Accueil',
    lang_label: 'Langue',
    sidebar_dashboard: 'Tableau de bord',
    sidebar_appts: 'Rendez-vous',
    sidebar_messages: 'Messagerie (simulée)',
    sidebar_telehealth: 'Télésanté',
    sidebar_billing: 'Facturation',
    sidebar_ehr: 'Dossiers cliniques',
    sidebar_clinician: 'Espace clinicien',
    sidebar_admin: 'Admin (simulation)',
    sidebar_cms: 'CMS (contenu)',
    sidebar_settings: 'Paramètres',
    sidebar_privacy: 'Confidentialité',
    skip_content: 'Aller au contenu',
    disclaimer_banner_line:
      'This is a mockup / Ceci est une maquette / Esto es un prototipo – no real services or data.',
    disclaimer_short:
      'Rien sur ce site ne constitue un avis médical ou psychologique. Aucune relation thérapeutique n’est établie. Aucun service psychologique ou médical réel n’est offert.',
    disclaimer_detail:
      'Démonstration seulement : les renseignements saisis servent à illustrer le produit et ne remplacent pas une évaluation clinique. Principes généraux de confidentialité et de déontologie applicables au Québec — sans revendication de certification officielle par cette maquette.',
    disclaimer_aria: 'Avis sur la nature fictive du site',
    disclaimer_form_title: 'Avis important (maquette)',
    disclaimer_form_p1:
      'Ce site est une démonstration : il ne fournit pas de soins, ne crée aucune obligation contractuelle, et ne remplace pas une consultation professionnelle. Rien ici ne constitue un avis médical ou psychologique.',
    disclaimer_form_p2:
      'Le texte saisi peut être conservé dans sa langue d’origine et traduit automatiquement en français (usage interne de démonstration uniquement).',
    footer_disclaimer:
      'Maquette à des fins de démonstration — aucun service clinique réel. En cas d’urgence : 911 ou 988 (Canada).',
    disclaimer_crisis:
      'En cas de crise ou de danger immédiat : composez le 911 ou la ligne 988 (Canada). Ce site ne gère pas les urgences.',
    booking_free_text_prompt:
      'Écrivez dans votre langue — Write in your language — Escribe en tu idioma.',
    booking_notes_hint:
      'Texte facultatif pour la démo. Pas de conseil clinique. Maximum 8000 caractères.',
    contact_preview_translate: 'Aperçu traduction FR (démo)',
    contact_preview_loading: 'Traduction en cours…',
    contact_preview_title: 'Aperçu (français — démo)',
    contact_preview_provider: 'Fournisseur',
    validation_required: 'Veuillez remplir tous les champs obligatoires.',
    contact_submitting: 'Envoi en cours…',
    contact_ok: 'Message reçu (maquette). Aucun courriel réel envoyé. Une copie traduite peut être enregistrée côté serveur pour démo.',
    contact_error: 'Échec de l’envoi. Vérifiez l’API.',
    cms_inline_banner:
      'Correction de texte (admin) : les champs en pointillés sont modifiables au clic. Éditeur riche : CMS.',
    cms_inline_disable: 'Désactiver la correction inline',
  },
  en: {
    nav_home: 'Home',
    nav_about: 'About',
    nav_services: 'Services',
    nav_team: 'Team',
    nav_blog: 'Blog',
    nav_contact: 'Contact',
    nav_login: 'Sign in',
    nav_register: 'Create account',
    nav_api: 'API',
    nav_book: 'Book a session',
    home_title: 'Virtual psychology clinic — Montreal',
    home_lead:
      'Telephone and video support (mockup). Demonstration only — no real clinical service.',
    home_cta_register: 'Create a demo account',
    home_cta_legal: 'Legal notices',
    about_title: 'About PsyNova (fictional)',
    about_p1:
      'PsyNova is a **product scenario** for a Quebec virtual clinic. Names and flows are fictional and aligned with ethical standards (OPQ, Law 25 — counsel review required before any public use).',
    about_p2:
      'No real address, no guaranteed outcomes. For emergencies call 911 or 988 (Canada).',
    services_title: 'Services (mockup)',
    services_lead: 'Categories below connect to booking after sign-in.',
    team_title: 'Team — fictional characters',
    team_lead:
      'Illustrations described as professional cartoon (soft pastel, semi-flat). No real photos; invented names.',
    blog_title: 'Blog — sample posts',
    blog_lead: 'Educational placeholders for Greater Montreal context.',
    blog_read: 'Read',
    contact_title: 'Contact (simulated)',
    contact_lead: 'This form does not send real email. Demo only.',
    contact_name: 'Name',
    contact_email: 'Email',
    contact_msg: 'Message',
    contact_send: 'Send (mockup)',
    contact_sent: 'Not sent — mockup without mail backend.',
    legal_title: 'Legal & ethics (draft)',
    admin_title: 'Admin dashboard (simulated)',
    admin_lead: 'Fictional aggregates. Admin demo role only.',
    msgs_title: 'Secure messaging (simulated)',
    msgs_lead: 'Fictional thread — no clinical persistence.',
    back_home: '← Home',
    lang_label: 'Language',
    sidebar_dashboard: 'Dashboard',
    sidebar_appts: 'Appointments',
    sidebar_messages: 'Messaging (simulated)',
    sidebar_telehealth: 'Telehealth',
    sidebar_billing: 'Billing',
    sidebar_ehr: 'Clinical records',
    sidebar_clinician: 'Clinician workspace',
    sidebar_admin: 'Admin (simulated)',
    sidebar_cms: 'CMS (content)',
    sidebar_settings: 'Settings',
    sidebar_privacy: 'Privacy / Legal',
    skip_content: 'Skip to content',
    disclaimer_banner_line:
      'This is a mockup / Ceci est une maquette / Esto es un prototipo – no real services or data.',
    disclaimer_short:
      'Nothing on this site constitutes medical or psychological advice. No therapeutic relationship is established. No real psychological or medical services are provided.',
    disclaimer_detail:
      'Demonstration only: information you enter illustrates the product and is not a clinical record. General privacy and professional standards (Quebec) apply as guiding principles — this mockup does not claim official certification.',
    disclaimer_aria: 'Notice on fictional nature of this site',
    disclaimer_form_title: 'Important notice (mockup)',
    disclaimer_form_p1:
      'This site is a demonstration: it does not provide care, create a contractual duty, or replace a professional consultation. Nothing here constitutes medical or psychological advice.',
    disclaimer_form_p2:
      'Your text may be kept in its original language and machine-translated into French for internal demonstration use only.',
    footer_disclaimer:
      'Demonstration mockup — no real clinical services. Emergency: 911 or 988 (Canada).',
    disclaimer_crisis:
      'In crisis or immediate danger: call 911 or 988 (Canada). This site does not handle emergencies.',
    booking_free_text_prompt: 'Write in your language — Écrivez dans votre langue — Escribe en tu idioma.',
    booking_notes_hint: 'Optional demo text. Not clinical advice. Max 8000 characters.',
    contact_preview_translate: 'Preview FR translation (demo)',
    contact_preview_loading: 'Translating…',
    contact_preview_title: 'Preview (French — demo)',
    contact_preview_provider: 'Provider',
    validation_required: 'Please fill all required fields.',
    contact_submitting: 'Sending…',
    contact_ok: 'Message received (mockup). No real email. A translated copy may be stored server-side for demo.',
    contact_error: 'Send failed. Check the API.',
    cms_inline_banner:
      'Human script correction (admin): click dashed fields to edit. Rich editor: CMS.',
    cms_inline_disable: 'Turn off inline editing',
  },
  es: {
    nav_home: 'Inicio',
    nav_about: 'Nosotros',
    nav_services: 'Servicios',
    nav_team: 'Equipo',
    nav_blog: 'Blog',
    nav_contact: 'Contacto',
    nav_login: 'Iniciar sesión',
    nav_register: 'Crear cuenta',
    nav_api: 'API',
    nav_book: 'Reservar',
    home_title: 'Clínica virtual de psicología — Montreal',
    home_lead:
      'Acompañamiento por teléfono y videollamada. Maqueta de demostración — sin servicio clínico real.',
    home_cta_register: 'Cuenta de demostración',
    home_cta_legal: 'Avisos legales',
    about_title: 'Sobre PsyNova (ficticio)',
    about_p1:
      'PsyNova es un **escenario de producto** para una clínica virtual en Quebec. Los textos son imaginarios (OPQ, Ley 25 — revisión legal obligatoria antes de uso público).',
    about_p2:
      'Sin dirección real ni promesas de curación. Emergencias: 911 o 988 (Canadá).',
    services_title: 'Servicios (maqueta)',
    services_lead: 'Las categorías enlazan con la reserva tras iniciar sesión.',
    team_title: 'Equipo — personajes ficticios',
    team_lead:
      'Ilustración tipo cartoon profesional (pastel suave, semi-plano). Sin fotos reales.',
    blog_title: 'Blog — artículos ficticios',
    blog_lead: 'Contenido educativo de ejemplo para Montreal.',
    blog_read: 'Leer',
    contact_title: 'Contacto (simulado)',
    contact_lead: 'El formulario no envía correo real.',
    contact_name: 'Nombre',
    contact_email: 'Correo',
    contact_msg: 'Mensaje',
    contact_send: 'Enviar (maqueta)',
    contact_sent: 'No enviado — maqueta sin servidor de correo.',
    legal_title: 'Avisos legales (borrador)',
    admin_title: 'Panel admin (simulado)',
    admin_lead: 'Datos ficticios. Solo rol admin en demo.',
    msgs_title: 'Mensajería segura (simulada)',
    msgs_lead: 'Hilo ficticio — sin persistencia clínica.',
    back_home: '← Inicio',
    lang_label: 'Idioma',
    sidebar_dashboard: 'Panel',
    sidebar_appts: 'Citas',
    sidebar_messages: 'Mensajería (simulada)',
    sidebar_telehealth: 'Telesalud',
    sidebar_billing: 'Facturación',
    sidebar_ehr: 'Historial clínico',
    sidebar_clinician: 'Espacio clínico',
    sidebar_admin: 'Admin (simulado)',
    sidebar_cms: 'CMS (contenido)',
    sidebar_settings: 'Ajustes',
    sidebar_privacy: 'Privacidad',
    skip_content: 'Ir al contenido',
    disclaimer_banner_line:
      'This is a mockup / Ceci est une maquette / Esto es un prototipo – no real services or data.',
    disclaimer_short:
      'Nada en este sitio constituye consejo médico o psicológico. No se establece relación terapéutica. No se ofrecen servicios psicológicos ni médicos reales.',
    disclaimer_detail:
      'Solo demostración: la información que ingrese ilustra el producto y no constituye historial clínico. Principios generales de privacidad y normas profesionales (Quebec) — esta maqueta no afirma certificación oficial.',
    disclaimer_aria: 'Aviso sobre el carácter ficticio del sitio',
    disclaimer_form_title: 'Aviso importante (maqueta)',
    disclaimer_form_p1:
      'Este sitio es una demostración: no brinda atención, no crea obligación contractual ni sustituye una consulta profesional. Nada aquí constituye consejo médico o psicológico.',
    disclaimer_form_p2:
      'Su texto puede conservarse en el idioma original y traducirse automáticamente al francés solo para uso interno de demostración.',
    footer_disclaimer:
      'Maqueta de demostración — sin servicios clínicos reales. Emergencia: 911 o 988 (Canadá).',
    disclaimer_crisis:
      'En crisis o peligro inmediato: llame al 911 o 988 (Canadá). Este sitio no atiende emergencias.',
    booking_free_text_prompt:
      'Escribe en tu idioma — Write in your language — Écrivez dans votre langue.',
    booking_notes_hint: 'Texto opcional para la demo. No es consejo clínico. Máx. 8000 caracteres.',
    contact_preview_translate: 'Vista previa FR (demo)',
    contact_preview_loading: 'Traduciendo…',
    contact_preview_title: 'Vista previa (francés — demo)',
    contact_preview_provider: 'Proveedor',
    validation_required: 'Complete todos los campos obligatorios.',
    contact_submitting: 'Enviando…',
    contact_ok: 'Mensaje recibido (maqueta). Sin correo real. Puede guardarse traducción en servidor (demo).',
    contact_error: 'Error al enviar. Revise la API.',
    cms_inline_banner:
      'Corrección de texto (admin): campos con borde punteado — clic para editar. Editor completo: CMS.',
    cms_inline_disable: 'Desactivar edición en línea',
  },
};

const BROWSER_LANG_STORAGE = 'psynova_ui_lang';

/**
 * First visit: detect `navigator.language` → fr | en | es (French default for Montreal QC).
 * Respects an explicit user choice already stored in localStorage.
 */
export function initBrowserLanguage() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  if (localStorage.getItem(BROWSER_LANG_STORAGE)) return;
  const nav = navigator.language || navigator.userLanguage || 'fr';
  const low = String(nav).toLowerCase();
  let code = 'fr';
  if (low.startsWith('en')) code = 'en';
  else if (low.startsWith('es')) code = 'es';
  else if (low.startsWith('fr')) code = 'fr';
  localStorage.setItem(BROWSER_LANG_STORAGE, code);
  syncHtmlLangFromUi();
}

/** Keep `<html lang>` aligned with UI language (call after init). */
export function syncHtmlLangFromUi() {
  if (typeof document === 'undefined') return;
  const code = uiLang();
  document.documentElement.lang = code === 'en' ? 'en' : code === 'es' ? 'es' : 'fr';
}

export function uiLang() {
  return localStorage.getItem(BROWSER_LANG_STORAGE) || 'fr';
}

export function setUiLang(code) {
  if (STR[code]) {
    localStorage.setItem(BROWSER_LANG_STORAGE, code);
    syncHtmlLangFromUi();
  }
}

/** @param {string} key */
export function t(key) {
  const lang = uiLang();
  const pack = STR[lang] || STR.fr;
  return pack[key] ?? STR.fr[key] ?? key;
}

/** Minimal markdown: **bold** → <strong> */
export function tHtml(key) {
  return t(key).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
```

===== FILE: app/frontend/src/legal-content.js =====

```javascript
/** Blocs légaux brouillon — maquette, non avis juridique. */

export function legalPageHtml(lang) {
  const blocks = {
    fr: `
      <section class="legal-section"><h2>Consentement éclairé (information)</h2>
      <p>Version maquette : en production, un consentement révisé par les instances compétentes et adapté à chaque modalité de service serait requis avant toute intervention.</p></section>
      <section class="legal-section"><h2>Confidentialité et Loi 25</h2>
      <p>Ce site ne collecte des données réelles que dans la mesure où vous utilisez l’API de démonstration avec des comptes fictifs. Aucune finalité clinique réelle.</p></section>
      <section class="legal-section"><h2>Télépsychologie</h2>
      <p>Les services à distance ont des limites (confidentialité du lieu, urgence, technologie). Ce prototype illustre des parcours sans les remplacer.</p></section>
      <section class="legal-section"><h2>Nature du site (maquette)</h2>
      <p>Cette interface ne constitue pas un service de santé mentale, ne fournit pas de conseils thérapeutiques ni de diagnostic, et ne crée aucune relation professionnelle. Aucune certification réglementaire n’est revendiquée par ce prototype.</p></section>
      <section class="legal-section"><h2>Urgences</h2>
      <p>En cas de danger immédiat : <strong>911</strong>. Ligne de prévention du suicide : <strong>988</strong> (Canada).</p></section>
      <section class="legal-section"><h2>Aucune garantie de résultat</h2>
      <p>La psychothérapie dépend de nombreux facteurs ; aucune amélioration n’est garantie. Texte à valider par des pairs et conseillers.</p></section>`,
    en: `
      <section class="legal-section"><h2>Informed consent (informational)</h2>
      <p>Mockup version: production would require counsel-reviewed consent for each service modality.</p></section>
      <section class="legal-section"><h2>Privacy & Law 25</h2>
      <p>This demo only processes data you send to the mock API with fictional accounts. No real clinical purpose.</p></section>
      <section class="legal-section"><h2>Telepsychology</h2>
      <p>Remote care has limits (privacy of setting, emergencies, technology). This prototype illustrates flows only.</p></section>
      <section class="legal-section"><h2>Site nature (mockup)</h2>
      <p>This interface is not mental health care, not therapeutic advice or diagnosis, and does not create a professional relationship. This prototype does not claim regulatory certification.</p></section>
      <section class="legal-section"><h2>Emergencies</h2>
      <p>Immediate danger: <strong>911</strong>. Suicide prevention: <strong>988</strong> (Canada).</p></section>
      <section class="legal-section"><h2>No outcome guarantee</h2>
      <p>Therapy outcomes vary; nothing here promises improvement. Requires professional and legal review.</p></section>`,
    es: `
      <section class="legal-section"><h2>Consentimiento informado (informativo)</h2>
      <p>Versión de maqueta: en producción se requeriría revisión legal y clínica.</p></section>
      <section class="legal-section"><h2>Privacidad y Ley 25</h2>
      <p>Esta demo solo procesa lo que envíes a la API ficticia. Sin finalidad clínica real.</p></section>
      <section class="legal-section"><h2>Telepsicología</h2>
      <p>La atención remota tiene límites. Este prototipo es ilustrativo.</p></section>
      <section class="legal-section"><h2>Naturaleza del sitio (maqueta)</h2>
      <p>Esta interfaz no es atención en salud mental, no ofrece consejo terapéutico ni diagnóstico, y no crea relación profesional. La maqueta no afirma certificación regulatoria.</p></section>
      <section class="legal-section"><h2>Urgencias</h2>
      <p>Peligro inmediato: <strong>911</strong>. Prevención del suicidio: <strong>988</strong> (Canadá).</p></section>
      <section class="legal-section"><h2>Sin garantía de resultado</h2>
      <p>Los resultados terapéuticos varían; este texto no promete curación.</p></section>`,
  };
  return blocks[lang] || blocks.fr;
}
```

===== FILE: app/frontend/src/main.js =====

```javascript
import { initBrowserLanguage, syncHtmlLangFromUi } from './i18n.js';
import './styles.css';
import { loadEmbeddedTranslateWidgetIfEnabled } from './translate-widget.js';
import { init } from './app.js';

initBrowserLanguage();
syncHtmlLangFromUi();
loadEmbeddedTranslateWidgetIfEnabled();
void init();
```

===== FILE: app/frontend/src/mockup-banner.js =====

```javascript
/**
 * Canonical Phase 1 mockup notice (must stay aligned across index.html, in-app strip, API header).
 * EN / FR / ES openings + shared suffix (no real services or data).
 */
export const MOCKUP_BANNER_PRIMARY =
  'This is a mockup / Ceci est une maquette / Esto es un prototipo – no real services or data.';

/** HTML for the fixed document banner (above #app). */
export function documentBannerHtml() {
  return `<p class="maquette-banner__line maquette-banner__line--primary">
    <span lang="en">This is a mockup</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="fr">Ceci est une maquette</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="es">Esto es un prototipo</span>
    <span class="maquette-banner__dash" aria-hidden="true"> – </span>
    <span lang="mul">no real services or data</span>
  </p>`;
}
```

===== FILE: app/frontend/src/service-categories.js =====

```javascript
/**
 * DRAFT — Catálogo de motifs de consultation / fil d’intake.
 * Source unique pour l’UI booking; l’API persiste le slug choisi (service_category).
 * Réviser les libellés avec l’équipe clinique avant production.
 */
export const DRAFT_SERVICE_CATEGORIES = [
  {
    id: 'individual',
    labelFr: 'Thérapie individuelle',
    labelEn: 'Individual therapy',
    blurbFr: 'Suivi psychologique individuel (adultes).',
    blurbEn: 'One-to-one psychological care (adults).',
  },
  {
    id: 'couples',
    labelFr: 'Couple',
    labelEn: 'Couples',
    blurbFr: 'Soutien relationnel et médiation thérapeutique.',
    blurbEn: 'Relationship support and therapeutic mediation.',
  },
  {
    id: 'family',
    labelFr: 'Famille',
    labelEn: 'Family',
    blurbFr: 'Séances impliquant plusieurs membres de la famille.',
    blurbEn: 'Sessions involving multiple family members.',
  },
  {
    id: 'youth',
    labelFr: 'Jeunesse (12–17)',
    labelEn: 'Youth (12–17)',
    blurbFr: 'Accompagnement adapté aux adolescents.',
    blurbEn: 'Developmentally appropriate adolescent support.',
  },
  {
    id: 'anxiety_mood',
    labelFr: 'Anxiété & humeur',
    labelEn: 'Anxiety & mood',
    blurbFr: 'Symptômes d’anxiété, dépression, stress.',
    blurbEn: 'Anxiety, depression, and stress-related symptoms.',
  },
  {
    id: 'adhd_focus',
    labelFr: 'TDAH / attention',
    labelEn: 'ADHD / attention',
    blurbFr: 'Difficultés d’attention, organisation, exécution.',
    blurbEn: 'Attention, organization, and executive functioning.',
  },
  {
    id: 'trauma',
    labelFr: 'Trauma informé',
    labelEn: 'Trauma-informed',
    blurbFr: 'Approches sensibles aux vécu traumatiques.',
    blurbEn: 'Trauma-sensitive clinical approaches.',
  },
  {
    id: 'assessment',
    labelFr: 'Évaluation',
    labelEn: 'Assessment',
    blurbFr: 'Bilan orienté diagnostic ou orientation de services.',
    blurbEn: 'Diagnostic-oriented or service-planning assessment.',
  },
  {
    id: 'other',
    labelFr: 'Autre',
    labelEn: 'Other',
    blurbFr: 'Précisez dans les notes au clinicien.',
    blurbEn: 'Add details in notes to clinician.',
  },
];

/** @param {string} lang 'fr' | 'en' | 'es' */
export function categoryLabel(cat, lang) {
  if (lang === 'fr') return cat.labelFr;
  if (lang === 'es') return cat.labelEn;
  return cat.labelEn;
}

export function categoryBlurb(cat, lang) {
  if (lang === 'fr') return cat.blurbFr;
  if (lang === 'es') return cat.blurbEn;
  return cat.blurbEn;
}

export function getCategoryById(id) {
  return DRAFT_SERVICE_CATEGORIES.find((c) => c.id === id) || null;
}
```

===== FILE: app/frontend/src/site-content.js =====

```javascript
/**
 * Contenu fictif — noms cartoon, aucune personne réelle.
 * Descriptions d’illustration pour génération d’assets ultérieure.
 */

export const TEAM = [
  {
    id: 'luna',
    name: 'Dr. Luna Brightmind',
    role: { fr: 'Psychologue', en: 'Psychologist', es: 'Psicóloga' },
    bio: {
      fr: 'Approche intégrative TCC et pleine conscience. Focus sur l’anxiété et les transitions de vie.',
      en: 'Integrative CBT and mindfulness. Focus on anxiety and life transitions.',
      es: 'TCC integrativa y mindfulness. Ansiedad y transiciones vitales.',
    },
    illustration:
      'Semi-flat portrait, soft teal and cream palette, warm smile, open posture, notebook motif in background — calm professionalism.',
  },
  {
    id: 'milo',
    name: 'Milo Dreamleaf',
    role: { fr: 'Travailleur social clinique', en: 'Clinical social worker', es: 'Trabajador social clínico' },
    bio: {
      fr: 'Soutien aux familles et aux jeunes; perspective systémique.',
      en: 'Supports families and youth; systemic lens.',
      es: 'Apoyo a familias y jóvenes; enfoque sistémico.',
    },
    illustration:
      'Pastel greens, seated figure with plant motif symbolizing growth, gentle eye contact, inclusive silhouette.',
  },
  {
    id: 'alex',
    name: 'Alex Cloudwalker',
    role: { fr: 'Psychothérapeute', en: 'Psychotherapist', es: 'Psicoterapeuta' },
    bio: {
      fr: 'Affirmatif 2SLGBTQ+; thérapie axée sur les forces et la résilience.',
      en: '2SLGBTQ+-affirming; strengths-based, resilience-focused care.',
      es: 'Afirmativo 2SLGBTQ+; enfoque en fortalezas y resiliencia.',
    },
    illustration:
      'Soft lavender and sky blue, abstract path/walkway motif, hopeful expression, recovery-oriented composition.',
  },
];

export const BLOG_POSTS = [
  {
    slug: 'hiver-montréal',
    title: {
      fr: 'L’hiver à Montréal et l’humeur : pistes d’auto-soins',
      en: 'Montreal winters and mood: gentle self-care ideas',
      es: 'Invierno en Montreal y el ánimo: ideas de autocuidado',
    },
    date: '2026-01-15',
    excerpt: {
      fr: 'Lumière, mouvement et lien social : rappels non médicalisés pour une maquette pédagogique.',
      en: 'Light, movement, connection — educational mockup, not medical advice.',
      es: 'Luz, movimiento y vínculos — contenido educativo de maqueta.',
    },
    body: {
      fr: `<p>Ceci est un <strong>article fictif</strong>. En pratique, un professionnel peut recommander luminothérapie validée, activité physique adaptée et suivis personnalisés.</p><p>Aucune donnée réelle ; viser une revue clinique avant publication.</p>`,
      en: `<p>This is a <strong>fictional article</strong>. In real care, clinicians may suggest evidence-based light therapy, tailored exercise, and follow-up.</p><p>No real data; clinical review required before live use.</p>`,
      es: `<p>Artículo <strong>ficticio</strong>. En la práctica clínica real se personalizan intervenciones con evidencia.</p>`,
    },
  },
  {
    slug: 'telepsychologie-quebec',
    title: {
      fr: 'Télépsychologie au Québec : attentes réalistes',
      en: 'Telepsychology in Quebec: realistic expectations',
      es: 'Telepsicología en Quebec: expectativas realistas',
    },
    date: '2026-02-01',
    excerpt: {
      fr: 'Confidentialité, consentement et limites technologiques — rappel pour la maquette.',
      en: 'Privacy, consent, tech limits — mockup reminder.',
      es: 'Privacidad, consentimiento y límites técnicos.',
    },
    body: {
      fr: `<p>La télépsychologie peut améliorer l’accès ; elle ne convient pas à toutes les situations. L’urgence vitale reste hors plateforme.</p>`,
      en: `<p>Telepsychology can improve access; it is not for every situation. Life-threatening emergencies belong off-platform.</p>`,
      es: `<p>Mejora el acceso pero no sustituye la emergencia presencial cuando hace falta.</p>`,
    },
  },
];

export function teamRole(member, lang) {
  return member.role[lang] || member.role.en;
}

export function teamBio(member, lang) {
  return member.bio[lang] || member.bio.en;
}

export function blogField(post, field, lang) {
  const v = post[field];
  if (!v) return '';
  return typeof v === 'string' ? v : v[lang] || v.en;
}
```

===== FILE: app/frontend/src/styles.css =====

```css
:root {
  --bg: #eef2f6;
  --surface: #ffffff;
  --text: #14232f;
  --muted: #5c6b7a;
  --border: #c9d4e0;
  --primary: #1a5f7a;
  --primary-hover: #134a61;
  --primary-soft: #e4f0f4;
  --danger: #b42318;
  --focus: #2563eb;
  --grayed: #9aa5b1;
  --radius: 8px;
  --font: system-ui, 'Segoe UI', Roboto, Ubuntu, sans-serif;
  --draft-ink: #3d4f5f;
  --draft-bg: #e8eef3;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.maquette-banner {
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  padding: 0.45rem 0.75rem;
  text-align: center;
  font-size: 0.72rem;
  line-height: 1.35;
  color: #2a3542;
  background: linear-gradient(180deg, #fff9e6 0%, #fdeec8 100%);
  border-bottom: 1px solid #e0c88a;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.maquette-banner__line {
  margin: 0;
  font-size: 0.74rem;
}

.maquette-banner__line--primary {
  font-weight: 600;
}

.maquette-banner__sub {
  margin: 0.15rem 0 0;
  font-size: 0.68rem;
  color: #4a5568;
  font-weight: 500;
}

.maquette-banner__sep {
  margin: 0 0.2rem;
  opacity: 0.65;
}

html {
  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
  line-height: 1.45;
}

body {
  margin: 0;
  min-height: 100vh;
}

a {
  color: var(--primary);
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
}

.skip-link:focus {
  left: 0.5rem;
  top: 0.5rem;
}

.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar__brand {
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  color: var(--text);
}

.sidebar__tag {
  font-size: 0.65rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 0.75rem 0.75rem;
}

.nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  text-decoration: none;
  color: var(--text);
  font-size: 0.9rem;
}

.nav-link:hover:not([aria-disabled='true']) {
  background: var(--bg);
}

.nav-link[aria-current='page'] {
  background: #e8eef4;
  font-weight: 600;
}

.nav-link[aria-disabled='true'],
.nav-link.disabled {
  color: var(--grayed);
  cursor: not-allowed;
  opacity: 0.75;
}

.main {
  flex: 1;
  padding: 1.25rem 1.5rem 2rem;
  max-width: 960px;
}

.main--booking {
  max-width: 1100px;
}

.banner-draft {
  background: var(--draft-bg);
  border: 1px solid var(--border);
  color: var(--draft-ink);
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.8rem;
  margin-bottom: 1rem;
}

.status-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.85rem;
  color: var(--muted);
  margin-bottom: 1rem;
}

.pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #e8f2eb;
  color: #1d4a2d;
}

.pill--warn {
  background: #fdeaea;
  color: var(--danger);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
}

.card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.form-row {
  margin-bottom: 0.75rem;
}

.form-row label {
  display: block;
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 0.25rem;
}

.form-row input,
.form-row select {
  width: 100%;
  max-width: 360px;
  padding: 0.45rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font: inherit;
}

.btn {
  display: inline-block;
  padding: 0.45rem 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--primary);
  background: var(--primary);
  color: #fff;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
}

.btn:hover {
  background: var(--primary-hover);
}

.btn--ghost {
  background: transparent;
  color: var(--primary);
}

.btn--danger {
  border-color: var(--danger);
  background: var(--danger);
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th,
td {
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--border);
}

.gray-panel {
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  color: var(--muted);
  background: #fafbfc;
}

.gray-panel h3 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: var(--grayed);
}

.muted {
  color: var(--muted);
  font-size: 0.85rem;
}

.error-msg {
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.hero {
  max-width: 520px;
}

.hero h1 {
  margin-top: 0;
  font-size: 1.75rem;
}

.public-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* Booking wizard (service-site pattern: calendar + slots + steps) */
.booking-wizard {
  position: relative;
  background: linear-gradient(165deg, #e8f1f6 0%, var(--surface) 18%);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.25rem 1.5rem 1.5rem;
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.booking-wizard--draft {
  border-color: #b8c9d6;
}

.booking-draft-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--draft-ink);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--border);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.booking-wizard__h {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  color: #0f2744;
}

.booking-wizard__sub {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.booking-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.booking-steps__i {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.booking-steps__i span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--border);
  color: var(--muted);
  font-weight: 600;
  font-size: 0.75rem;
}

.booking-steps__i--on span {
  background: var(--primary);
  color: #fff;
}

.booking-panel {
  max-width: 520px;
}

.booking-panel--wide {
  max-width: none;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.65rem;
  margin-bottom: 1rem;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  font: inherit;
  color: var(--text);
  transition: border-color 0.12s, background 0.12s, box-shadow 0.12s;
}

.category-card:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.category-card--selected {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 1px var(--primary);
}

.category-card__title {
  font-weight: 600;
  font-size: 0.88rem;
  line-height: 1.25;
}

.category-card__blurb {
  font-size: 0.72rem;
  color: var(--muted);
  line-height: 1.3;
}

@media (max-width: 520px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}

.booking-lead {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}

.cal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.cal-toolbar__title {
  font-weight: 600;
  color: #0f2744;
}

.cal {
  width: 100%;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.cal th {
  text-align: center;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--muted);
  border: none;
}

.cal td {
  text-align: center;
  vertical-align: middle;
  padding: 0.2rem;
  border: none;
}

.cal__pad {
  border: none;
}

.cal__day {
  min-width: 2.25rem;
  height: 2.25rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: var(--surface);
  font: inherit;
  cursor: pointer;
  color: var(--text);
}

.cal__day:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}

.cal__day--selected {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.cal__day--disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.slot-btn {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.slot-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.slot-btn--selected {
  background: #e8f0f7;
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.booking-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.75rem;
}

.radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  font-size: 0.9rem;
}

.input-textarea {
  width: 100%;
  max-width: 420px;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
  resize: vertical;
}

.booking-confirm__title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}

.booking-summary {
  margin: 0 0 1rem;
  padding-left: 1.1rem;
  font-size: 0.9rem;
}

/* Public site (maquette) */
.public-page {
  max-width: 1100px;
  margin: 0 auto;
}

.public-inner {
  padding-top: 0.5rem;
}

.public-h1 {
  margin-top: 0;
  font-size: 1.65rem;
}

.public-lead {
  margin-bottom: 1.25rem;
}

.public-nav--bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.public-nav__a {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.88rem;
  padding: 0.25rem 0.35rem;
  border-radius: 4px;
}

.public-nav__a:hover {
  background: var(--primary-soft);
}

.public-nav__a--current {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-nav__sp {
  flex: 1;
  min-width: 0.5rem;
}

.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
}

.lang-switch__sel {
  font: inherit;
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.login-lang {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;
}

.hero--wide {
  max-width: 52rem;
}

.hero__lead {
  font-size: 1rem;
  max-width: 40rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.home-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.home-card {
  display: block;
  padding: 1rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.home-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(26, 95, 122, 0.12);
}

.home-card h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
  color: var(--primary);
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}

.service-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.85rem 1rem;
  background: var(--surface);
}

.service-card__h {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.service-card__p {
  margin: 0;
  font-size: 0.82rem;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.team-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  background: var(--surface);
}

.team-card__avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.team-card__name {
  margin: 0;
  font-size: 1.05rem;
}

.team-card__role {
  margin: 0.15rem 0 0.5rem;
  font-size: 0.8rem;
  color: var(--primary);
  font-weight: 600;
}

.team-card__bio {
  margin: 0 0 0.5rem;
  font-size: 0.88rem;
}

.team-card__illust {
  font-size: 0.72rem;
  line-height: 1.35;
}

.blog-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.blog-row__date {
  font-size: 0.75rem;
  color: var(--muted);
}

.blog-row__h {
  margin: 0.25rem 0;
  font-size: 1.05rem;
}

.blog-row__h a {
  color: var(--text);
  text-decoration: none;
}

.blog-row__h a:hover {
  color: var(--primary);
  text-decoration: underline;
}

.back-link {
  margin-bottom: 1rem;
}

.blog-article__body {
  font-size: 0.95rem;
  line-height: 1.55;
}

.blog-article__body p {
  margin: 0.65rem 0;
}

.legal-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.legal-section h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.legal-section p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.input-wide {
  max-width: 100%;
  width: 100%;
}

.contact-form .form-row {
  margin-bottom: 0.85rem;
}

.msg-thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 520px;
}

.msg-bubble {
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-size: 0.9rem;
  line-height: 1.45;
}

.msg-bubble__who {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  margin-bottom: 0.25rem;
}

.msg-bubble--them {
  background: #e8f0f7;
  align-self: flex-start;
  border: 1px solid var(--border);
}

.msg-bubble--me {
  background: #e8f4ea;
  align-self: flex-end;
  border: 1px solid #c5dcc8;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.admin-stat__n {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin: 0.25rem 0 0;
}

.dash-links h2 {
  margin-top: 0;
}

/* CMS */
.cms-admin .cms-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1rem;
}

.cms-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.cms-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.cms-panel[hidden] {
  display: none !important;
}

.cms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.cms-card {
  margin-bottom: 1rem;
}

.cms-lbl {
  display: block;
  margin-bottom: 0.75rem;
}

.cms-quill {
  background: #fff;
  border-radius: 8px;
}

.cms-editable {
  cursor: pointer;
  outline: 1px dashed transparent;
}

.cms-editable:hover {
  outline-color: var(--primary, #2a6fdb);
}

.admin-human-correction-hint {
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: #f0f7ff;
  border: 1px solid #b6d4fe;
}

.admin-human-correction-hint__p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.team-card__avatar--img {
  padding: 0;
  overflow: hidden;
}

.team-card__avatar--img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.cms-home-testimonials {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}

.public-h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.cms-testimonial-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.cms-testimonial {
  margin: 0;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #fafbfc;
}

.cms-testimonial__img {
  border-radius: 50%;
  display: block;
  margin-bottom: 0.5rem;
}

.cms-testimonial__q {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  line-height: 1.45;
}

.cms-testimonial figcaption {
  font-size: 0.8rem;
  color: var(--muted);
}

.mockup-strip {
  font-size: 0.78rem;
  line-height: 1.45;
  padding: 0.5rem 0.75rem;
  background: #2d3142;
  color: #f4f4f8;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.mockup-strip__sep {
  margin: 0 0.35rem;
  opacity: 0.6;
}

.content-disclaimer {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  border-left: 4px solid var(--primary, #2a6fdb);
}

.content-disclaimer__line {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.content-disclaimer__sub {
  margin: 0;
  font-size: 0.82rem;
}

.card--disclaimer {
  background: #f8fafc;
}

.form-disclaimer {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px dashed var(--border);
  border-radius: 8px;
  background: #fafbfc;
  font-size: 0.82rem;
  line-height: 1.5;
}

.form-disclaimer__mockup {
  margin: 0 0 0.5rem;
  font-size: 0.84rem;
}

.form-disclaimer__title {
  margin: 0 0 0.5rem;
  font-weight: 700;
  font-size: 0.88rem;
}

.form-disclaimer__p {
  margin: 0 0 0.5rem;
}

.form-disclaimer__crisis {
  margin: 0;
  font-weight: 600;
  color: #6b2d2d;
}

.site-footer-disclaimer {
  margin-top: 2rem;
  padding: 1rem 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--muted);
}

.site-footer-disclaimer__mockup {
  margin: 0 0 0.35rem;
  color: var(--text);
}

.site-footer-disclaimer__text {
  margin: 0;
}

.booking-lang-prompt {
  font-size: 0.88rem;
  font-style: italic;
  color: var(--muted);
  margin: 0.5rem 0 0.75rem;
}

.contact-preview {
  margin-top: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fff;
}

.contact-preview__h {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.translate-widget {
  position: fixed;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 50;
  max-width: min(200px, 40vw);
  font-size: 0.75rem;
}

@media (max-width: 720px) {
  .layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}
```

===== FILE: app/frontend/src/translate-widget.js =====

```javascript
/**
 * Optional embedded page translation (fallback when API keys are absent).
 * Enable with VITE_ENABLE_TRANSLATE_WIDGET=true — loads Google website translator.
 * Does not replace server-side storage of originals + FR copy for forms.
 */
export function loadEmbeddedTranslateWidgetIfEnabled() {
  if (import.meta.env.VITE_ENABLE_TRANSLATE_WIDGET !== 'true') return;
  if (typeof document === 'undefined') return;
  const id = 'google_translate_element';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.className = 'translate-widget';
    el.setAttribute('aria-label', 'Embedded page translation (fallback)');
    document.body.appendChild(el);
  }
  window.googleTranslateElementInit = function googleTranslateElementInit() {
    try {
      const g = window.google;
      if (!g?.translate?.TranslateElement) return;
      const el = g.translate.TranslateElement;
      new el(
        {
          pageLanguage: 'fr',
          includedLanguages: 'fr,en,es',
          layout: el.InlineLayout.SIMPLE,
        },
        id,
      );
    } catch {
      /* optional widget */
    }
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.head.appendChild(s);
}
```

===== FILE: app/frontend/vite.config.js =====

```javascript
import { defineConfig } from 'vite';

// Browser hits same-origin /api; Vite forwards to Nest (avoids CORS "Failed to fetch").
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000';

const apiProxy = {
  '/api': {
    target: proxyTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist-psynova',
    emptyOutDir: true,
  },
});
```
