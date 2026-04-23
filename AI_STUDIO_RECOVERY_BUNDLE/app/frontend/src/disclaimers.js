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
