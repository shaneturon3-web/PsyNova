#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-$(pwd)}"
APP_JS="$ROOT/app/frontend/src/app.js"
STYLES="$ROOT/app/frontend/src/styles.css"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$ROOT/recovery/booking-flow-restore-v2-$STAMP"

if [ ! -f "$APP_JS" ]; then
  echo "Could not find $APP_JS"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "$APP_JS" "$BACKUP_DIR/app.js"
[ -f "$STYLES" ] && cp "$STYLES" "$BACKUP_DIR/styles.css"

python3 - "$ROOT" "$BACKUP_DIR" <<'PY'
from pathlib import Path
import sys

root = Path(sys.argv[1])
backup_dir = Path(sys.argv[2])
app = root / "app/frontend/src/app.js"
styles = root / "app/frontend/src/styles.css"

src = app.read_text(encoding="utf-8")

bridge = r'''
/* PSYNOVA_BOOKING_FLOW_RESTORE_V2
   Reversible public booking bridge.
   Purpose: restore Specialty -> Book appointment -> calendar/time -> login-after-commit
   without requiring fragile internal router markers.
*/
(() => {
  const FLAG = "psynova_booking_bridge_loaded_v2";
  if (window[FLAG]) return;
  window[FLAG] = true;

  const INTENT_KEY = "psynova_pending_booking_intent_v2";
  const SPECIALTIES = ["Anxiety", "Depression", "Trauma", "Couples", "Family", "Child", "Adolescent", "Adult", "Assessment", "Psychotherapy"];
  const hours = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

  function readIntent() {
    try { return JSON.parse(sessionStorage.getItem(INTENT_KEY) || "{}"); }
    catch { return {}; }
  }

  function writeIntent(intent) {
    sessionStorage.setItem(INTENT_KEY, JSON.stringify({ ...readIntent(), ...intent }));
  }

  function clearIntent() {
    sessionStorage.removeItem(INTENT_KEY);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function slugify(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function getMount() {
    return document.querySelector("#app, main, [data-app], .app") || document.body;
  }

  function dateOptions() {
    const out = [];
    const d = new Date();
    for (let i = 1; i <= 21; i += 1) {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      const day = x.getDay();
      if (day === 0 || day === 6) continue;
      out.push(x.toISOString().slice(0, 10));
      if (out.length >= 10) break;
    }
    return out;
  }

  function specialtyFromElement(el) {
    const explicit = el.getAttribute("data-book-service") || el.getAttribute("data-specialty") || el.getAttribute("data-service-slug");
    if (explicit) return explicit;
    const card = el.closest("[data-service-slug], article, section, .card, .service-card");
    const text = (card || el).innerText || el.textContent || "";
    const firstLine = text.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "Psychotherapy";
    return firstLine.slice(0, 80);
  }

  function renderBooking() {
    const intent = readIntent();
    const dates = dateOptions();

    const specialtyOptions = SPECIALTIES.map((name) => {
      const selected = slugify(intent.specialty || intent.categoryId) === slugify(name) ? "selected" : "";
      return `<option value="${esc(name)}" ${selected}>${esc(name)}</option>`;
    }).join("");

    const dateButtons = dates.map((date) => `
      <button type="button" class="psynova-booking-bridge__date ${intent.date === date ? "is-selected" : ""}" data-bridge-date="${esc(date)}">${esc(date)}</button>
    `).join("");

    const timeButtons = hours.map((hour) => `
      <button type="button" class="psynova-booking-bridge__time ${intent.time === hour ? "is-selected" : ""}" data-bridge-time="${esc(hour)}">${esc(hour)}</button>
    `).join("");

    getMount().innerHTML = `
      <section class="psynova-booking-bridge" aria-labelledby="psynova-booking-title">
        <div class="psynova-booking-bridge__copy">
          <a href="#/" class="psynova-booking-bridge__back">← Back</a>
          <p class="psynova-booking-bridge__eyebrow">Appointment request</p>
          <h1 id="psynova-booking-title">Book an appointment</h1>
          <p>Select the specialty, date, and hour first. Login and patient information are requested only after you commit.</p>
          <label class="psynova-booking-bridge__label">
            Specialty
            <select data-bridge-specialty>
              <option value="">Choose a specialty</option>
              ${specialtyOptions}
            </select>
          </label>
        </div>

        <div class="psynova-booking-bridge__plugin" role="group" aria-label="Booking calendar and time selection">
          <div class="psynova-booking-bridge__calendar">
            <h2>Date</h2>
            <div class="psynova-booking-bridge__grid">${dateButtons}</div>
          </div>
          <div class="psynova-booking-bridge__hours">
            <h2>Hour</h2>
            <div class="psynova-booking-bridge__grid">${timeButtons}</div>
            <button type="button" class="psynova-booking-bridge__commit" data-bridge-commit>Continue to secure login</button>
            <p class="psynova-booking-bridge__note">Clinical forms, documents, telehealth, and records remain in the approved third-party systems.</p>
          </div>
        </div>
      </section>
    `;
  }

  function openBookingWithIntent(intent = {}) {
    writeIntent(intent);
    if (location.hash !== "#/book") location.hash = "#/book";
    renderBooking();
  }

  function handleRoute() {
    if (location.hash === "#/book" || location.hash === "#book") {
      setTimeout(renderBooking, 0);
    }
  }

  document.addEventListener("click", (event) => {
    const specialtyButton = event.target.closest("[data-book-service], [data-specialty], [data-service-slug] button, .service-card button");
    if (specialtyButton) {
      event.preventDefault();
      openBookingWithIntent({ specialty: specialtyFromElement(specialtyButton), source: "specialty" });
      return;
    }

    const bookingLink = event.target.closest('a[href="#/book"], a[href="/book"], [data-open-booking]');
    if (bookingLink) {
      event.preventDefault();
      openBookingWithIntent({ source: "book-button" });
      return;
    }

    const dateButton = event.target.closest("[data-bridge-date]");
    if (dateButton) {
      writeIntent({ date: dateButton.getAttribute("data-bridge-date") });
      renderBooking();
      return;
    }

    const timeButton = event.target.closest("[data-bridge-time]");
    if (timeButton) {
      writeIntent({ time: timeButton.getAttribute("data-bridge-time") });
      renderBooking();
      return;
    }

    const commit = event.target.closest("[data-bridge-commit]");
    if (commit) {
      const intent = readIntent();
      if (!intent.specialty || !intent.date || !intent.time) {
        alert("Please choose a specialty, date, and hour before continuing.");
        return;
      }
      writeIntent({ committedAt: new Date().toISOString(), needsLogin: true });
      location.hash = "#/login";
    }
  }, true);

  document.addEventListener("change", (event) => {
    const specialty = event.target.closest("[data-bridge-specialty]");
    if (specialty) writeIntent({ specialty: specialty.value });
  });

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("DOMContentLoaded", handleRoute);
  handleRoute();

  window.psynovaBookingBridge = { openBookingWithIntent, readIntent, clearIntent };
})();
'''

if "PSYNOVA_BOOKING_FLOW_RESTORE_V2" not in src:
    src = src.rstrip() + "\n\n" + bridge + "\n"
    app.write_text(src, encoding="utf-8")

css = styles.read_text(encoding="utf-8") if styles.exists() else ""
css_patch = r'''
/* PSYNOVA_BOOKING_FLOW_RESTORE_V2 */
.psynova-booking-bridge {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem 1rem;
  display: grid;
  grid-template-columns: minmax(260px, .75fr) minmax(360px, 1.25fr);
  gap: 1.25rem;
  align-items: start;
}

.psynova-booking-bridge__copy,
.psynova-booking-bridge__plugin {
  border: 1px solid rgba(15, 23, 42, .12);
  border-radius: 20px;
  padding: 1.25rem;
  background: rgba(255, 255, 255, .92);
}

.psynova-booking-bridge__plugin {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.psynova-booking-bridge__eyebrow {
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: .78rem;
  font-weight: 800;
}

.psynova-booking-bridge__label {
  display: grid;
  gap: .45rem;
  margin-top: 1rem;
  font-weight: 700;
}

.psynova-booking-bridge select,
.psynova-booking-bridge button {
  font: inherit;
}

.psynova-booking-bridge select {
  width: 100%;
  border-radius: 12px;
  padding: .75rem;
  border: 1px solid rgba(15, 23, 42, .2);
}

.psynova-booking-bridge__grid {
  display: grid;
  gap: .6rem;
}

.psynova-booking-bridge__date,
.psynova-booking-bridge__time,
.psynova-booking-bridge__commit {
  cursor: pointer;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, .18);
  padding: .7rem .9rem;
  background: #fff;
}

.psynova-booking-bridge__date.is-selected,
.psynova-booking-bridge__time.is-selected {
  outline: 3px solid rgba(15, 23, 42, .18);
  font-weight: 800;
}

.psynova-booking-bridge__commit {
  width: 100%;
  margin-top: 1rem;
  font-weight: 800;
}

.psynova-booking-bridge__note {
  font-size: .9rem;
  opacity: .78;
}

@media (max-width: 860px) {
  .psynova-booking-bridge,
  .psynova-booking-bridge__plugin {
    grid-template-columns: 1fr;
  }
}
'''
if "PSYNOVA_BOOKING_FLOW_RESTORE_V2" not in css:
    styles.write_text(css.rstrip() + "\n\n" + css_patch + "\n", encoding="utf-8")

note = root / "docs/GITHUB_NOTE_BOOKING_FLOW_RESTORE_V2.md"
note.parent.mkdir(exist_ok=True)
note.write_text(f'''# Booking flow restore v2

Applied reversible public booking bridge.

Why v2:
The previous patch expected a `viewAppointments` marker in `app/frontend/src/app.js`; the current local file no longer has that marker after Studio edits. This version avoids fragile internal markers and restores the behavior through a small public booking bridge appended to `app.js`.

Restored behavior:
- Specialty buttons/cards open `#/book`.
- Book appointment opens the same booking flow.
- Calendar and hour selection display side-by-side on desktop.
- Login is requested only after the patient commits the selected specialty/date/hour.
- Pending booking intent is stored in `sessionStorage`.
- Clinical intake, documents, telehealth, and patient-record custody remain outside this app.

Backup:
`recovery/{backup_dir.name}/`

Revert:
```bash
bash psynova-booking-flow-restore-v2/scripts/revert-booking-flow-restore-v2.sh
```
or manually restore:
```bash
cp recovery/{backup_dir.name}/app.js app/frontend/src/app.js
cp recovery/{backup_dir.name}/styles.css app/frontend/src/styles.css
```
''', encoding="utf-8")

print(f"Applied booking flow restore v2. Backup: {backup_dir}")
PY

echo "Done. Start frontend and test: #/book, specialty buttons, then commit -> #/login"
