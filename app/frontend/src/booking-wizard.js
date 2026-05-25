// BOOKING_FLOW_RESTORE_START
/**
 * Multi-step booking: category → calendar → time → session → confirm.
 * Inline split layout: context / specialty (left) · calendar + slots (right).
 * This mock does not collect or persist clinical notes, documents, or PHI.
 */
// BOOKING_FLOW_RESTORE_END

import { pickLocalizedText, stripHtml } from './cms-util.js';
import { formDisclaimerBlock } from './disclaimers.js';
import { uiLang } from './i18n.js';
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
    sessionType: 'zoom_video',
    sessionProvider: 'zoom',
    patientPhone: '',
    contactEmail: '',
    groupParticipants: 1,
    groupRole: 'host',
    anonymousGroup: false,
    calYear: n.getFullYear(),
    calMonth: n.getMonth(),
  };
}

function defaultProviderForType(type) {
  if (type === 'backup_video') return 'daily';
  if (type === 'group_video') return 'jitsi';
  if (type === 'phone') return 'phone_direct';
  if (type === 'voip') return 'twilio';
  return 'zoom';
}

function providerLabel(provider, esc) {
  const labels = {
    zoom: 'Zoom',
    daily: 'Daily.co (placeholder)',
    whereby: 'Whereby (placeholder)',
    jitsi: 'Jitsi',
    phone_direct: 'Direct phone call',
    twilio: 'Twilio (placeholder)',
    telnyx: 'Telnyx (placeholder)',
    vonage: 'Vonage (placeholder)',
  };
  return esc(labels[provider] || provider || '—');
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

function displayTimeLabel(hhmm) {
  const [h, m] = String(hhmm || '00:00').split(':').map((n) => Number(n));
  const hr12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${hr12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
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
 * @param {'fr'|'en'|'es'} lang
 * @param {object[] | null | undefined} cmsServices
 */
function selectedCategoryContextHtml(booking, esc, lang, cmsServices) {
  if (!booking.categoryId) {
    return `<p class="muted">${tx('Sélectionnez un motif à gauche (étape 1).', 'Select a visit reason in step 1.', 'Elija un motivo en el paso 1.')}</p>`;
  }
  if (cmsServices?.length) {
    const s = cmsServices.find((x) => x.slug === booking.categoryId);
    if (s) {
      const title = esc(pickLocalizedText(s, 'title', lang));
      const body = esc(stripHtml(pickLocalizedText(s, 'body', lang) || '').slice(0, 500));
      return `<div class="booking-inline-split__context-inner">
        <h3 class="booking-inline-split__h">${title}</h3>
        <div class="booking-inline-split__blurb muted">${body}</div>
      </div>`;
    }
  }
  const cat = DRAFT_SERVICE_CATEGORIES.find((c) => c.id === booking.categoryId);
  if (!cat) {
    return `<p class="muted">${esc(booking.categoryId)}</p>`;
  }
  return `<div class="booking-inline-split__context-inner">
    <h3 class="booking-inline-split__h">${esc(categoryLabel(cat, lang))}</h3>
    <p class="booking-inline-split__blurb muted">${esc(categoryBlurb(cat, lang))}</p>
  </div>`;
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

  const sc = (n) => {
    if (step > n) return 'booking-steps__i booking-steps__i--done';
    if (step === n) return 'booking-steps__i booking-steps__i--active';
    return 'booking-steps__i booking-steps__i--todo';
  };
  const mark = (n) => (step > n ? '✓' : String(n));
  const stepper = `
    <ol class="booking-steps" aria-label="${tx('Progression', 'Progress', 'Progreso')}">
      <li class="${sc(1)}"><span class="booking-steps__mark" aria-hidden="true">${mark(1)}</span> <span class="booking-steps__icon" aria-hidden="true">🧭</span> ${tx('Motif', 'Reason', 'Motivo')}</li>
      <li class="${sc(2)}"><span class="booking-steps__mark" aria-hidden="true">${mark(2)}</span> <span class="booking-steps__icon" aria-hidden="true">📅</span> ${tx('Date', 'Date', 'Fecha')}</li>
      <li class="${sc(3)}"><span class="booking-steps__mark" aria-hidden="true">${mark(3)}</span> <span class="booking-steps__icon" aria-hidden="true">🕒</span> ${tx('Heure', 'Time', 'Hora')}</li>
      <li class="${sc(4)}"><span class="booking-steps__mark" aria-hidden="true">${mark(4)}</span> <span class="booking-steps__icon" aria-hidden="true">💻</span> ${tx('Séance', 'Session', 'Sesión')}</li>
      <li class="${sc(5)}"><span class="booking-steps__mark" aria-hidden="true">${mark(5)}</span> <span class="booking-steps__icon" aria-hidden="true">✅</span> ${tx('Confirmer', 'Confirm', 'Confirmar')}</li>
    </ol>`;
  const visualCard = `
    <aside class="booking-visual-card" aria-label="${tx('Guided booking', 'Guided booking', 'Reserva guiada')}">
      <h3 class="booking-visual-card__h">${tx('Guided booking', 'Guided booking', 'Reserva guiada')}</h3>
      <p class="booking-visual-card__p">${tx(
        'Parcours simple et sécurisé : choisissez un motif, puis date et heure.',
        'Simple and guided flow: pick a reason, then date and time.',
        'Flujo simple y guiado: primero motivo, después fecha y hora.',
      )}</p>
      <ul class="booking-visual-card__list">
        <li>✅ ${tx('Aucune note clinique ici', 'No clinical notes here', 'Sin notas clínicas aquí')}</li>
        <li>🛡️ ${tx('Sélection avant connexion', 'Choose before sign-in', 'Elegir antes de iniciar sesión')}</li>
        <li>📌 ${tx('Confirmation à la fin', 'Confirm at the end', 'Confirmar al final')}</li>
      </ul>
    </aside>`;

  let leftCol = '';
  if (step === 1) {
    leftCol = `
      <div class="booking-inline-split__left">
        ${formDisclaimerBlock()}
        <p class="booking-lead">${tx(
          'Choisissez le motif principal (liste DRAFT — pas un bilan clinique).',
          'Choose the main reason (DRAFT list — not a clinical assessment).',
          'Elija el motivo principal (lista DRAFT — no es evaluación clínica).',
        )}</p>
        <div class="category-grid" role="group" aria-label="${tx('Motif', 'Service category', 'Motivo')}">${categoryCardsHtml(booking, esc, lang, cmsServices)}</div>
        <p class="muted" style="margin-top:0.5rem;">${tx(
          'Un clic sur un motif ouvre le calendrier à droite.',
          'Selecting a reason opens the calendar in the right column.',
          'Al elegir un motivo se abre el calendario a la derecha.',
        )}</p>
        <div class="booking-actions"><button type="button" class="btn btn--ghost" id="booking-back-home">← ${tx('Services', 'Services', 'Servicios')}</button></div>
      </div>`;
  } else {
    leftCol = `
      <div class="booking-inline-split__left" aria-label="${tx('Contexte', 'Context', 'Contexto')}">
        ${formDisclaimerBlock()}
        <p class="booking-lead">${tx('Votre sélection', 'Your selection', 'Su elección')}</p>
        ${selectedCategoryContextHtml(booking, esc, lang, cmsServices)}
        <p class="muted" style="margin-top:1rem;">${tx(
          'Compte requis seulement après la confirmation (dernière étape).',
          'Sign-in is only required after the final confirm step.',
          'Iniciar sesión solo tras el paso final de confirmación.',
        )}</p>
      </div>`;
  }

  let rightCol = '';
  if (step === 1) {
    rightCol = `
      <div class="booking-inline-split__right booking-plugin" aria-label="${tx('Calendrier', 'Calendar', 'Calendario')}">
        <h3 class="booking-plugin__h">${tx('Prochaine étape', 'Next', 'Siguiente paso')}</h3>
        <p class="muted">${tx(
          'Le calendrier apparaîtra ici dès qu’un motif est choisi (colonne de gauche).',
          'The booking calendar appears here after you select a service reason on the left.',
          'El calendario aparecerá aquí al elegir un motivo a la izquierda.',
        )}</p>
      </div>`;
  } else if (step === 2) {
    rightCol = `
      <div class="booking-inline-split__right booking-plugin" aria-label="${tx('Calendrier', 'Calendar', 'Calendario')}">
        ${formDisclaimerBlock()}
        <h3 class="booking-plugin__h">${tx('Choisir une date', 'Pick a date', 'Elija una fecha')}</h3>
        <p class="booking-lead">${tx(
          'D’abord le calendrier; les heures disponibles viennent à l’étape suivante.',
          'Calendar first; available start times are on the next step.',
          'Primero el calendario; los horarios en el siguiente paso.',
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
          <button type="button" class="btn" id="booking-next-1" ${booking.dateStr ? '' : 'disabled'}>${tx('Suivant', 'Continue', 'Continuar')}</button>
        </div>
      </div>`;
  } else if (step === 3) {
    const slotButtons = slots
      .map(
        (slo) =>
          `<button type="button" class="slot-btn${slo === booking.timeStr ? ' slot-btn--selected' : ''}" data-booking-time="${esc(slo)}"><span class="slot-btn__time">${esc(displayTimeLabel(slo))}</span><span class="slot-btn__meta">50 min · ${tx('Available', 'Available', 'Disponible')}</span></button>`,
      )
      .join('');
    rightCol = `
      <div class="booking-inline-split__right booking-plugin" aria-label="${tx('Horaire', 'Schedule', 'Horario')}">
        ${formDisclaimerBlock()}
        <h3 class="booking-plugin__h">${tx('Choisir une heure de départ', 'Choose a start time', 'Elija la hora de inicio')}</h3>
        <p class="muted">${tx('Date', 'Date', 'Fecha')}: <strong>${esc(booking.dateStr)}</strong></p>
        <p class="booking-lead">${tx('Heure de début', 'Start time', 'Hora de inicio')} (${SLOT_STEP_MIN} min).</p>
        <div class="slot-grid" role="group" aria-label="${tx('Créneaux', 'Time slots', 'Horarios')}">${slotButtons}</div>
        <div class="booking-actions">
          <button type="button" class="btn btn--ghost" id="booking-back-3">${tx('Retour', 'Back', 'Atrás')}</button>
          <button type="button" class="btn" id="booking-next-2" ${booking.timeStr ? '' : 'disabled'}>${tx('Suivant', 'Continue', 'Continuar')}</button>
        </div>
      </div>`;
  } else if (step === 4) {
    const selectedType = booking.sessionType || 'zoom_video';
    const providerValue = booking.sessionProvider || defaultProviderForType(selectedType);
    const phoneValue = booking.patientPhone || '';
    const emailValue = booking.contactEmail || user?.email || '';
    rightCol = `
      <div class="booking-inline-split__right booking-plugin">
        ${formDisclaimerBlock()}
        <h3 class="booking-plugin__h">${tx('Format de la séance', 'Session format', 'Formato de la sesión')}</h3>
        <p class="muted">${esc(booking.dateStr)} · ${esc(booking.timeStr)}</p>
        <div class="booking-session-options">
          <div class="booking-session-option${selectedType === 'zoom_video' ? ' booking-session-option--selected' : ''}">
            <label><input type="radio" name="sessionType" value="zoom_video" ${selectedType === 'zoom_video' ? 'checked' : ''} /> Zoom video session <span class="booking-provider-badge">Primary</span></label>
            <p class="muted booking-session-option__helper">Secure video appointment link will be generated after confirmation.</p>
          </div>
          <div class="booking-session-option${selectedType === 'backup_video' ? ' booking-session-option--selected' : ''}">
            <label><input type="radio" name="sessionType" value="backup_video" ${selectedType === 'backup_video' ? 'checked' : ''} /> Backup video session</label>
            <p class="muted booking-session-option__helper">Used if Zoom is unavailable or not configured.</p>
            <div class="form-row booking-provider-field">
              <label for="booking-session-provider">Backup provider</label>
              <select id="booking-session-provider" name="backupProvider">
                <option value="daily" ${providerValue === 'daily' ? 'selected' : ''}>Daily.co</option>
                <option value="whereby" ${providerValue === 'whereby' ? 'selected' : ''}>Whereby</option>
                <option value="jitsi" ${providerValue === 'jitsi' ? 'selected' : ''}>Jitsi</option>
              </select>
            </div>
          </div>
          <div class="booking-session-option${selectedType === 'phone' ? ' booking-session-option--selected' : ''}">
            <label><input type="radio" name="sessionType" value="phone" ${selectedType === 'phone' ? 'checked' : ''} /> Telephone session</label>
            <p class="muted booking-session-option__helper">Therapist will call the patient at the confirmed phone number.</p>
          </div>
          <div class="booking-session-option${selectedType === 'group_video' ? ' booking-session-option--selected' : ''}">
            <label><input type="radio" name="sessionType" value="group_video" ${selectedType === 'group_video' ? 'checked' : ''} /> Group video session</label>
            <p class="muted booking-session-option__helper">Multi-participant session with host/co-host/participant roles.</p>
            <div class="form-row booking-provider-field">
              <label for="booking-group-size">Participants</label>
              <select id="booking-group-size" name="groupParticipants">
                <option value="2" ${String(booking.groupParticipants || 2) === '2' ? 'selected' : ''}>2 participants</option>
                <option value="3" ${String(booking.groupParticipants || 2) === '3' ? 'selected' : ''}>3 participants</option>
                <option value="4" ${String(booking.groupParticipants || 2) === '4' ? 'selected' : ''}>4 participants</option>
                <option value="5" ${String(booking.groupParticipants || 2) === '5' ? 'selected' : ''}>5 participants</option>
              </select>
            </div>
            <div class="form-row booking-provider-field">
              <label for="booking-group-role">Your role</label>
              <select id="booking-group-role" name="groupRole">
                <option value="host" ${booking.groupRole === 'host' ? 'selected' : ''}>Host</option>
                <option value="co_host" ${booking.groupRole === 'co_host' ? 'selected' : ''}>Co-host</option>
                <option value="participant" ${booking.groupRole === 'participant' ? 'selected' : ''}>Participant</option>
              </select>
            </div>
            <label class="booking-check-inline">
              <input type="checkbox" name="anonymousGroup" ${booking.anonymousGroup ? 'checked' : ''} />
              Anonymous Plan B mode
            </label>
          </div>
          <div class="booking-session-option${selectedType === 'voip' ? ' booking-session-option--selected' : ''}">
            <label><input type="radio" name="sessionType" value="voip" ${selectedType === 'voip' ? 'checked' : ''} /> VoIP call</label>
            <div class="form-row booking-provider-field">
              <label for="booking-voip-provider">VoIP provider</label>
              <select id="booking-voip-provider" name="voipProvider">
                <option value="twilio" ${providerValue === 'twilio' ? 'selected' : ''}>Twilio placeholder</option>
                <option value="telnyx" ${providerValue === 'telnyx' ? 'selected' : ''}>Telnyx placeholder</option>
                <option value="vonage" ${providerValue === 'vonage' ? 'selected' : ''}>Vonage placeholder</option>
              </select>
            </div>
          </div>
        </div>
        <div class="booking-session-contact">
          <div class="form-row">
            <label for="booking-patient-phone">Patient phone</label>
            <input id="booking-patient-phone" name="patientPhone" type="tel" value="${esc(phoneValue)}" placeholder="+1 514 555 0100" />
          </div>
          <div class="form-row">
            <label for="booking-contact-email">Patient email</label>
            <input id="booking-contact-email" name="contactEmail" type="email" value="${esc(emailValue)}" placeholder="patient@example.com" />
          </div>
        </div>
        <p class="muted">${
          user?.email
            ? `${esc(user.email)} · ${tx('Langue UI', 'UI language', 'Idioma UI')}: ${esc(lang)}`
            : tx(
                "Pas de compte requis ici. Vous serez invité à vous connecter seulement à l'étape « Confirmer ».",
                'No sign-in on this step. You will be asked to sign in only on the final Confirm step.',
                'Sin inicio de sesión aquí: solo en el paso final « Confirmar ».',
              )
        }</p>
        <div class="booking-actions">
          <button type="button" class="btn btn--ghost" id="booking-back-4">${tx('Retour', 'Back', 'Atrás')}</button>
          <button type="button" class="btn" id="booking-next-3">${tx('Suivant', 'Continue', 'Continuar')}</button>
        </div>
      </div>`;
  } else {
    const durMin = 50;
    const typeLabelMap = {
      zoom_video: 'Zoom video session',
      backup_video: 'Backup video session',
      group_video: 'Group video session',
      phone: 'Telephone session',
      voip: 'VoIP call',
    };
    const fmt = typeLabelMap[booking.sessionType] || 'Zoom video session';
    let catLine = booking.categoryId || '—';
    if (cmsServices?.length) {
      const s = cmsServices.find((x) => x.slug === booking.categoryId);
      if (s) catLine = pickLocalizedText(s, 'title', lang);
    } else {
      const cat = DRAFT_SERVICE_CATEGORIES.find((c) => c.id === booking.categoryId);
      catLine = cat ? categoryLabel(cat, lang) : catLine;
    }
    const therapist = tx('Assigned demo therapist', 'Assigned demo therapist', 'Terapeuta de demostración asignado');
    const emailLine = booking.contactEmail || user?.email || tx('Sign in to attach account email', 'Sign in to attach account email', 'Inicie sesión para asociar correo');
    const phoneLine = booking.patientPhone || '—';
    const providerValue = booking.sessionProvider || defaultProviderForType(booking.sessionType);
    const providerLine = providerLabel(providerValue, esc);
    const providerConfigured = providerValue === 'jitsi';
    const joinInstructions = providerConfigured
      ? 'Join link will be shown from configured provider details.'
      : 'Demo mode: provider credentials pending.';
    rightCol = `
      <div class="booking-inline-split__right booking-plugin">
        ${formDisclaimerBlock()}
        <h3 class="booking-confirm__title">${tx('Confirmer la réservation', 'Confirm booking', 'Confirmar reserva')}</h3>
        <ul class="booking-summary">
          <li><strong>${tx('Therapist', 'Therapist', 'Terapeuta')}:</strong> ${esc(therapist)}</li>
          <li><strong>${tx('Motif', 'Reason', 'Motivo')}:</strong> ${esc(catLine)}</li>
          <li><strong>Session type:</strong> ${esc(fmt)}</li>
          <li><strong>Provider:</strong> ${providerLine}</li>
          <li><strong>Group participants:</strong> ${esc(booking.sessionType === 'group_video' ? String(booking.groupParticipants || 2) : 'N/A')}</li>
          <li><strong>Role:</strong> ${esc(
            booking.sessionType === 'group_video'
              ? booking.groupRole === 'co_host'
                ? 'Co-host'
                : booking.groupRole === 'participant'
                  ? 'Participant'
                  : 'Host'
              : 'N/A',
          )}</li>
          <li><strong>Anonymous Plan B:</strong> ${esc(booking.sessionType === 'group_video' && booking.anonymousGroup ? 'Enabled' : 'Disabled')}</li>
          <li><strong>Patient phone:</strong> ${esc(phoneLine)}</li>
          <li><strong>Patient email:</strong> ${esc(emailLine)}</li>
          <li><strong>Appointment date:</strong> ${esc(booking.dateStr)}</li>
          <li><strong>Appointment time:</strong> ${esc(displayTimeLabel(booking.timeStr))} (${durMin} min)</li>
          <li><strong>Join instructions:</strong> ${esc(joinInstructions)}</li>
        </ul>
        <p class="muted">${tx('Crée une demande', 'Creates a', 'Crea una solicitud')} <code>pending</code> ${tx('via l’API (maquette) — sans notes cliniques dans cette appli.', 'via API (mock) — this app does not store clinical free text.', 'por API (maqueta) — sin notas clínicas en esta app.')}</p>
        <form id="form-appt-booking" novalidate>
          <div class="booking-actions">
            <button type="button" class="btn btn--ghost" id="booking-back-5">${tx('Retour', 'Back', 'Atrás')}</button>
            <button type="submit" class="btn" id="booking-submit">${tx('Confirm appointment', 'Confirm appointment', 'Confirmar cita')}</button>
          </div>
        </form>
      </div>`;
  }

  return `
    <section class="booking-wizard booking-wizard--draft" aria-labelledby="booking-wizard-title">
      <div class="booking-draft-badge" role="status">DRAFT</div>
      <h2 id="booking-wizard-title" class="booking-wizard__h">${tx('Prendre rendez-vous', 'Book a session', 'Reservar cita')}</h2>
      <p class="booking-wizard__sub">${tx(
        'Colonne de gauche : contexte. Colonne de droite : calendrier, puis horaires, puis confirmation. Maquette seulement.',
        'Left: context. Right: calendar, then time slots, then details and confirm. Mockup only.',
        'Columna izquierda: contexto. Derecha: calendario, horarios, confirmación. Solo maqueta.',
      )}</p>
      ${stepper}
      ${visualCard}
      <div class="booking-inline-split">
        ${leftCol}
        ${rightCol}
      </div>
    </section>`;
}
