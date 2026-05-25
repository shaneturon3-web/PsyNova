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
