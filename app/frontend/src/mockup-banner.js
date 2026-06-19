/**
 * Canonical Phase 1 mockup notice (must stay aligned across index.html, in-app strip, API header).
 * EN / FR / ES public preview opening.
 */
export const MOCKUP_BANNER_PRIMARY =
  'PsyNova public preview / Aperçu public PsyNova / Vista pública PsyNova';

/** HTML for the fixed document banner (above #app). */
export function documentBannerHtml() {
  return `<p class="maquette-banner__line maquette-banner__line--primary">
    <span lang="en">PsyNova public preview</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="fr">Aperçu public PsyNova</span>
    <span class="maquette-banner__sep" aria-hidden="true"> / </span>
    <span lang="es">Vista pública PsyNova</span>

  </p>`;
}
