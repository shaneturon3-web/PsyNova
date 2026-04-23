import { initBrowserLanguage, syncHtmlLangFromUi } from './i18n.js';
import './styles.css';
import { loadEmbeddedTranslateWidgetIfEnabled } from './translate-widget.js';
import { init } from './app.js';

initBrowserLanguage();
syncHtmlLangFromUi();
loadEmbeddedTranslateWidgetIfEnabled();
void init();
