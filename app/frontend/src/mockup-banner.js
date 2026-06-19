/**
 * Canonical Phase 1 mockup notice (must stay aligned across index.html, in-app strip, API header).
 * EN / FR / ES openings + shared suffix (no real services or data).
 */
export const MOCKUP_BANNER_PRIMARY =
  'PsyNova public preview / Aperçu public PsyNova / Vista pública PsyNova — platform information only, not emergency care.';

/** HTML for the fixed document banner (above #app). */
export function documentBannerHtml() {
  return `<p class="maquette-banner__line maquette-banner__line--primary">
    <span lang="en">PsyNova public preview</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="fr">Aperçu public PsyNova</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="es">Vista pública PsyNova</span>
    <span class="maquette-banner__dash" aria-hidden="true"> – </span>
    <span lang="mul">no real services or data</span>
  </p>`;
}
