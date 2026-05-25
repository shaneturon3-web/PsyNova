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
