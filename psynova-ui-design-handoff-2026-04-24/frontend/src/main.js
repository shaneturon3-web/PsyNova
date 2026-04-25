import { initBrowserLanguage, syncHtmlLangFromUi } from './i18n.js';
import './styles.css';
import { loadEmbeddedTranslateWidgetIfEnabled } from './translate-widget.js';
import { init } from './app.js';

initBrowserLanguage();
syncHtmlLangFromUi();
loadEmbeddedTranslateWidgetIfEnabled();
void init().catch((err) => {
  console.error('[PsyNova] init() failed', err);
  const root = document.getElementById('app');
  if (root) {
    const msg = err && err.message ? String(err.message) : String(err);
    root.innerHTML = `<div class="main public-page" style="padding:2rem;max-width:40rem">
      <h1 style="margin-top:0">App could not start</h1>
      <p class="error-msg">${msg.replace(/</g, '&lt;')}</p>
      <p class="muted">If you are using the legacy maquette, ensure the backend is reachable (CMS) or check the browser console.</p>
    </div>`;
  }
});
