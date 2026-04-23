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
