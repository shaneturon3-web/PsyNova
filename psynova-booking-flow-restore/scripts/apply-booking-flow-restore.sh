#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
APP_JS="$ROOT/app/frontend/src/app.js"
BOOKING_JS="$ROOT/app/frontend/src/booking-wizard.js"
STYLES="$ROOT/app/frontend/src/styles.css"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$ROOT/recovery/booking-flow-restore-$STAMP"

mkdir -p "$BACKUP_DIR"
cp "$APP_JS" "$BACKUP_DIR/app.js"
cp "$BOOKING_JS" "$BACKUP_DIR/booking-wizard.js"
[ -f "$STYLES" ] && cp "$STYLES" "$BACKUP_DIR/styles.css"

python3 - "$ROOT" "$BACKUP_DIR" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
backup_dir = Path(sys.argv[2])
app = root/'app/frontend/src/app.js'
booking = root/'app/frontend/src/booking-wizard.js'
styles = root/'app/frontend/src/styles.css'

src = app.read_text(encoding='utf-8')
if 'PSYNOVA_BOOKING_FLOW_RESTORE_V1' not in src:
    src = src.replace(
        "${item('/contact', 'nav_contact')}  ${langSwitcher()}",
        "${item('/contact', 'nav_contact')} <a href=\"#/book\" class=\"public-nav__a public-nav__a--book\">Book appointment</a>  ${langSwitcher()}",
        1,
    )

    src = src.replace(
        "【5†${esc(hero.ctaBook?.label || '')}】",
        "<a href=\"#/book\" class=\"btn btn-primary\" data-open-booking>${esc(hero.ctaBook?.label || 'Book appointment')}</a>",
        1,
    )

    src = src.replace(
        "return `\n### ${esc(title)}\n\n${body}\n\n`; })",
        "return `\n<article class=\"service-card\" data-service-slug=\"${esc(s.slug || '')}\">\n### ${esc(title)}\n\n${body}\n\n<button type=\"button\" class=\"service-card__book\" data-book-service=\"${esc(s.slug || '')}\">Book this specialty</button>\n</article>\n`; })",
        1,
    )

    marker = "function viewAppointments() {"
    insert = '''
/* PSYNOVA_BOOKING_FLOW_RESTORE_V1
   Restores public specialty -> booking -> calendar/time -> login-after-commit flow.
   Reversible: restore files from recovery/booking-flow-restore-* or run scripts/revert-booking-flow-restore.sh.
*/
function persistBookingIntent() {
  try {
    sessionStorage.setItem('psynova_pending_booking_intent', JSON.stringify(state.booking || {}));
  } catch {}
}

function restoreBookingIntent() {
  try {
    const raw = sessionStorage.getItem('psynova_pending_booking_intent');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.booking = { ...defaultBookingState(), ...parsed };
  } catch {}
}

function clearBookingIntent() {
  try { sessionStorage.removeItem('psynova_pending_booking_intent'); } catch {}
}

function selectedBookingServiceTitle() {
  const lang = uiLang();
  const slug = state.booking?.categoryId;
  if (!slug) return '';
  const svc = state.cms?.bundle?.services?.find((s) => s.slug === slug);
  if (svc) return pickLocalizedText(svc, 'title', lang);
  const cat = getCategoryById(slug);
  return cat ? categoryLabel(cat, lang) : slug;
}

function viewBookAppointment() {
  restoreBookingIntent();
  const selected = selectedBookingServiceTitle();
  const explain = state.user
    ? 'You are signed in. Confirming will create the pending appointment request.'
    : 'Choose a specialty, date, and hour first. Login starts only after you commit the booking.';
  return publicPageWrap(`
    <section class="booking-restore booking-restore--public">
      <div class="booking-restore__intro">
        <p><a href="#/services">← Services</a></p>
        <h1>Book an appointment</h1>
        <p>${esc(explain)}</p>
        ${selected ? `<p class="booking-restore__selected">Selected specialty: <strong>${esc(selected)}</strong></p>` : ''}
      </div>
      <div class="booking-restore__plugin">
        ${bookingWizardHtml(state.booking, esc, state.user, state.cms?.bundle?.services)}
      </div>
    </section>
  `, '/book');
}
'''
    if marker not in src:
        raise SystemExit('Could not find viewAppointments marker in app.js')
    src = src.replace(marker, insert + "\n" + marker, 1)

    src = src.replace(
        "} else if (r === '/contact') { html = viewContact(); } else if (r === '/login')",
        "} else if (r === '/contact') { html = viewContact(); } else if (r === '/book') { html = viewBookAppointment(); } else if (r === '/login')",
        1,
    )

    src = src.replace(
        "const wz = e.target.closest('.booking-wizard'); if (!wz) return; const t = e.target.closest('button'); if (!t) return;",
        "const serviceButton = e.target.closest('[data-book-service]'); if (serviceButton) { state.booking = { ...defaultBookingState(), categoryId: serviceButton.getAttribute('data-book-service') || '', step: 2 }; persistBookingIntent(); navigate('/book'); return; } const wz = e.target.closest('.booking-wizard'); if (!wz) return; const t = e.target.closest('button'); if (!t) return;",
        1,
    )

    src = src.replace("state.booking.dateStr = t.getAttribute('data-booking-date') || ''; render(); return;", "state.booking.dateStr = t.getAttribute('data-booking-date') || ''; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.timeStr = t.getAttribute('data-booking-time') || ''; render(); return;", "state.booking.timeStr = t.getAttribute('data-booking-time') || ''; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.categoryId = t.getAttribute('data-booking-category') || ''; render(); return;", "state.booking.categoryId = t.getAttribute('data-booking-category') || ''; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.step = 2; render(); return;", "state.booking.step = 2; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.step = 3; render(); return;", "state.booking.step = 3; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.step = 4; render(); return;", "state.booking.step = 4; persistBookingIntent(); render(); return;", 1)
    src = src.replace("state.booking.step = 5; render(); return;", "state.booking.step = 5; persistBookingIntent(); render(); return;", 1)

    src = src.replace(
        "e.preventDefault(); state.formError = null; const start = new Date(`${state.booking.dateStr}T${state.booking.timeStr}:00`);",
        "e.preventDefault(); state.formError = null; if (!state.user?.sub) { persistBookingIntent(); state.banner = 'Sign in to finish this booking request.'; navigate('/login'); return; } const start = new Date(`${state.booking.dateStr}T${state.booking.timeStr}:00`);",
        1,
    )

    src = src.replace(
        "state.banner = null; state.formError = null; navigate('/app');",
        "state.banner = null; state.formError = null; if (sessionStorage.getItem('psynova_pending_booking_intent')) { restoreBookingIntent(); navigate('/book'); } else { navigate('/app'); }",
        1,
    )

    src = src.replace(
        "state.booking = defaultBookingState(); render();",
        "state.booking = defaultBookingState(); clearBookingIntent(); render();",
        1,
    )

app.write_text(src, encoding='utf-8')

b = booking.read_text(encoding='utf-8')
if 'booking-wizard--side-by-side' not in b:
    b = b.replace(
        "return `\n\nDRAFT\n## ${tx('Prendre rendez-vous', 'Book a session', 'Reservar cita')}",
        "return `\n\n<div class=\"booking-wizard--side-by-side\">\nDRAFT\n## ${tx('Prendre rendez-vous', 'Book a session', 'Reservar cita')}",
        1,
    )
    b = b.replace("${stepper} ${body} `; }", "${stepper} <div class=\"booking-wizard__stage\">${body}</div></div> `; }", 1)
booking.write_text(b, encoding='utf-8')

css = styles.read_text(encoding='utf-8') if styles.exists() else ''
if 'PSYNOVA_BOOKING_FLOW_RESTORE_V1' not in css:
    css += '''

/* PSYNOVA_BOOKING_FLOW_RESTORE_V1 */
.public-nav__a--book,
.service-card__book {
  font-weight: 700;
}

.booking-restore {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.booking-restore__intro {
  margin-bottom: 1rem;
}

.booking-restore__selected {
  padding: .75rem 1rem;
  border: 1px solid currentColor;
  border-radius: 12px;
}

.booking-wizard--side-by-side {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(320px, 1.2fr);
  gap: 1rem;
  align-items: start;
}

.booking-wizard__stage,
.booking-restore__plugin .booking-wizard {
  min-width: 0;
}

.service-card {
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 16px;
  padding: 1rem;
  margin: 1rem 0;
}

.service-card__book {
  cursor: pointer;
  border-radius: 999px;
  padding: .65rem 1rem;
}

@media (max-width: 820px) {
  .booking-wizard--side-by-side {
    grid-template-columns: 1fr;
  }
}
'''
styles.write_text(css, encoding='utf-8')

note = root/'docs/GITHUB_NOTE_BOOKING_FLOW_RESTORE.md'
note.write_text(f'''# Booking flow restore note

Applied reversible patch from `{backup_dir.name}`.

Restored behavior:
- Specialty/service buttons open `#/book` with the selected specialty already set.
- `#/book` is public, so the patient can choose specialty, date, and time before authentication.
- Calendar/time selector is displayed as a side-by-side booking plugin layout where space allows.
- Login is requested only when the patient commits the booking request.
- Pending booking intent is stored in `sessionStorage` and resumed after login.
- Original files were copied into `recovery/{backup_dir.name}/`.

Revert:
```bash
bash scripts/revert-booking-flow-restore.sh
```

Compliance note:
This restores scheduling intent UX only. Do not collect clinical intake, protected notes, telehealth media, or document custody in this app unless reviewed and explicitly approved.
''', encoding='utf-8')

print(f"Applied booking flow restore. Backup: {backup_dir}")
PY

echo "Done. Review with: cd app/frontend && npm run dev"
