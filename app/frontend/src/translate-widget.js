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
