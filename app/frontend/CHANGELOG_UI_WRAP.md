# PsyNova — UI wrap changelog (non-destructive)

All entries confirm: **no backend changes**, **no API contract changes**, **no route renames**, **no booking step order/state logic changes** (except a documented local-only sign-in escape hatch). Disclaimers and mockup copy remain in the bundle.

---

## 2026-04-24 — `frontend/src/styles.css`

| Change | Reason |
|--------|--------|
| Appended `/* PSYNOVA_UI_WRAP_START */` … `/* PSYNOVA_UI_WRAP_END */` at file bottom | Isolate visual “wrap” overrides for review and diffs. |
| `@keyframes psynova-fade-in-up`, `psynova-step-pulse` | Subtle animation for shell content and active booking step (presentation only). |
| `html { scroll-behavior: smooth }` | Slightly calmer in-page feel; no behavior change to routing. |
| `body` gradient background (fixed) | Calmer, modern app atmosphere using CSS only (no external image dependency). |
| `.main.public-page` padding, `::before` radial decor | Soft abstract “hero region” without changing DOM. |
| `.public-inner` spacing | Readability. |
| `.public-nav--bar` glassy bar, border-radius, shadow | Cleaner app shell; same markup/classes. |
| `.public-nav__a` / `--current` pill-style affordances | Clearer active state; same `href` routes. |
| `.hero` / `.hero--wide` gradient border, `::after` soft blob | Richer home hero; CMS strings unchanged. |
| `.card` (excluding `.contact-form` / `.form-disclaimer` where noted), `.team-card`, `button.category-card` | Rounded, soft shadows, hover lift where appropriate. |
| `team-card::before` small ◆ | Decorative “badge” via emoji/character (no new packages). |
| `.booking-wizard`, `.booking-inline-split`, `.booking-plugin`, `.booking-steps` | Tighter “product” look; no JS changes. |
| `.booking-steps__i--active .booking-steps__mark` animation | Active step subtle pulse. |
| `.cal` | Light inset polish. |
| `.btn` / `.btn--ghost` / `:active` | Hover lift + transitions (no route/API impact). |
| `@media (max-width: 760px)` | Stack-friendly grids, booking column, step bar shrink; no new breakpoints for logic. |

**API / logic:** Unchanged. Pure CSS; later rules may override earlier blocks where selectors coincide.

---

## 2026-04-24 — `frontend/src/app-legacy.js`

| Change | Reason |
|--------|--------|
| Import `setToken` from `./api.js` | Needed to store a local-only token value for the preview flow (still no backend file edits). |
| `PSYNOVA_DEMO_UI_TOKEN` + `refreshUser` branch for that token | **Local UI preview only:** with this token, `me()` is skipped and `state.user` is filled with a mock therapist so `/app/*` layouts render without a real password check. **Does not change** Nest `auth` module, guards, or JWT format on the server. |
| `viewLogin`: password no longer `required` / `minlength(8)`; label + help text | Allow empty password path explicitly documented as dev-only. |
| Login `submit` handler: if **email present** and **password empty** → set demo token, `refreshUser`, `navigate` to `/app` (or return route) | Lets you open signed-in views without API validation (per request). Real password still uses `login()`. |
| On real `login()`: clear demo token if present | Restores normal API session when password used. |
| `btn-logout`: if demo token, skip `logout()` request; always clear `psynova_demo_email` | Avoids failing API call with non-JWT; clears client. |

**Booking / routes / CMS:** Unchanged. **Note:** With demo mode, some API calls from `/app` may still fail; UI is visible. Remove demo by using a real password or “Log out”.

---

## 2026-04-24 — `frontend/src/booking-wizard.js`

| Change | Reason |
|--------|--------|
| (none) | Step markup/classes already support `.booking-steps__i--active` / `--done` / `--todo` from prior work; wrap CSS targets existing selectors. |

**Booking state machine / steps:** Unchanged this pass.

---

## `frontend/src/api.js` & backend

| Status |
|--------|
| **Not modified.** Demo mode avoids calling `/auth/login` for empty password; server contracts unchanged. |

---

## 2026-04-24 (visible pass) — homepage/services/team/booking emphasis

### `frontend/src/app-legacy.js`
- Landing hero upgraded to a **split two-column layout**: existing title/lead/CTAs unchanged on the left, added decorative image panel on the right (`.hero__visual`, `.hero__image`) using the provided Unsplash URL.
- Home feature cards now render a `home-card__icon` badge with rotating icons (`🧠 💬 🌿 📅 🛡️ ✨`) before each title.
- Services cards now render `service-card__icon` using index-based icon mapping (`🧠 🌙 💬 🌿 🤝 ✨`) without touching slugs or booking category wiring.
- Team cards now use photo fallback images (provided Unsplash set) when CMS avatar is missing; initials fallback removed for this view.
- Team cards now include visual specialty pills (`CBT`, `Mindfulness`, `Virtual care`) and `Book session` CTA in addition to existing profile CTA.

### `frontend/src/booking-wizard.js`
- Booking step labels now include icons while preserving original step numbers and progression:
  - `1 🧭 Reason`
  - `2 📅 Date`
  - `3 🕒 Time`
  - `4 💻 Session`
  - `5 ✅ Confirm`
- Added a presentational `booking-visual-card` block (guided reassurance/check rows) before the split columns.
- No state transitions, validators, button IDs, or handlers changed.

### `frontend/src/styles.css`
- Added `/* PSYNOVA_VISIBLE_UI_WRAP_START */` … `/* PSYNOVA_VISIBLE_UI_WRAP_END */` at file bottom.
- Implemented visibly stronger styling:
  - gradient page background
  - glassy/sticky public nav
  - split hero with image card
  - icon badges for home/services/booking steps
  - larger rounded cards + deeper soft shadows
  - hover lift on cards/buttons
  - `fadeInUp` entry animation
  - improved team card visuals/chips/CTA spacing
  - booking visual card + stronger booking panel/stepper look
  - responsive stacking at `max-width: 760px`

**Confirmation:** This pass changed presentation only in allowed frontend files. No backend, API contract, route names, CMS schema, disclaimer/legal text, booking state machine, or persistence logic were modified.

---

## 2026-04-24 (demo completion pass) — test workflows and mock data coverage

### Files modified
- `frontend/src/app-legacy.js`
- `frontend/src/booking-wizard.js`
- `frontend/src/styles.css`
- `frontend/CHANGELOG_UI_WRAP.md`

### What was added/changed
- Booking slot buttons now show clearer labels: formatted time (`9:00 AM` style), duration (`50 min`), and availability copy.
- Booking wizard final summary expanded to include therapist line, service, date/time, session format, and patient email line; final action label set to **Confirm appointment**.
- Added visible booking navigation support (`booking-back-home`) and confirmation card in booking pages.
- Added robust **DEMO / FICTIONAL** frontend datasets (6 therapists, 8 patients, messages, emails, records, demo appointments) in `app-legacy.js`.
- Team view now falls back to demo therapist cards when CMS doctors are unavailable, including specialties/languages/meta labels.
- Added route `#/therapist-demo` with profile, appointments list, patients list, inbox, email activity, and local confirm/cancel actions.
- Added route `#/records-demo` with records table and `View`/`Export CSV`/`Export JSON` actions via frontend Blob downloads.
- Added public navigation links for **Therapist Demo** and **Records Demo**, plus back/workflow links in relevant views.
- Appointments view now merges demo rows with API rows and provides local confirm/cancel controls for demo entries.
- Added local fallback behavior for booking submit when API is unavailable: creates a local demo appointment and shows a demo confirmation note.
- Added style support for demo modules: status badges, therapist demo layout, slot metadata labels, and records/messages components.

### Mock-only notes
- `#/therapist-demo` and `#/records-demo` are demo routes.
- Export actions are frontend-only Blob downloads.
- Confirm/cancel in demo areas update local frontend state only.
- Booking fallback on API failure stores a local demo appointment for flow testing.

### Constraints respected
- No backend file changes.
- No API contract changes.
- Existing routes preserved; only additive demo routes introduced.
- Legal/mockup disclaimers retained.
- Booking core step progression and data flow preserved.

---

## Build

_Updated after `npm run build` (2026-04-24, demo completion pass)._

```
> psynova-frontend@0.1.0 build
> vite build

vite v5.4.21 building for production.
✓ 20 modules transformed.
dist-psynova/index.html                   0.58 kB │ gzip:  0.40 kB
dist-psynova/assets/index-Bup1KGBT.css   31.02 kB │ gzip:  6.94 kB
dist-psynova/assets/index-C0JoVbhc.js   112.56 kB │ gzip: 31.39 kB
✓ built in ~1.20s
```

**Exit code:** 0

---

## 2026-04-25 (virtual sessions audit + integration plan only)

### Scope
- Repository audit completed for:
  - `frontend/src/`
  - `backend/src/`
  - booking flow
  - therapist/admin areas
  - appointment/session model touchpoints
  - env/config and package manifests
- Created planning document:
  - `docs/VIRTUAL_SESSIONS_INTEGRATION_PLAN.md`

### Findings captured
- Existing booking flow already captures `sessionType` in frontend state, but backend appointment DTO/storage does not yet persist a session transport/provider model.
- Existing `#/app/telehealth` route is currently a placeholder and is the recommended UI insertion point for provider-agnostic session controls.
- Existing backend `vendor-links` module supports public telehealth URL readiness but not realtime session provisioning APIs yet.
- Provider plan documented with explicit placeholders:
  - Zoom primary
  - Daily/Whereby backups
  - Jitsi open/self-hostable option
  - Twilio Voice + Telnyx/Vonage phone fallback options
  - signup-gated credentials marked `PLACEHOLDER_API_KEY_REQUIRED`

### Build verification
- Frontend build (`app/frontend`): `npm run build` -> success.
- Backend build (`app/backend`): `npm run build` -> success.
- No documentation-only import/path corrections were required.

### Behavior/API impact
- No frontend runtime behavior changed.
- No backend runtime behavior changed.
- No API contracts changed.

---

## 2026-04-25 (booking session options UX pass)

### Files modified
- `frontend/src/booking-wizard.js`
- `frontend/src/app-legacy.js`
- `frontend/src/compliance-gateway.js`
- `frontend/src/styles.css`
- `frontend/CHANGELOG_UI_WRAP.md`

### Booking step updates (non-destructive)
- Kept existing 5-step flow and back/next IDs unchanged.
- Session step now includes explicit options:
  - Zoom video session (Primary badge)
  - Backup video session (Daily.co / Whereby / Jitsi placeholders)
  - Telephone session
  - VoIP call (Twilio / Telnyx / Vonage placeholders)
- Added visible contact fields in session step:
  - patient phone
  - patient email

### Confirmation summary updates
- Final confirmation now visibly includes:
  - session type
  - provider
  - patient phone
  - patient email
  - appointment date
  - appointment time
  - therapist
  - join instructions
- When provider credentials are not configured, summary shows:
  - `Demo mode: provider credentials pending.`

### Integration and safety notes
- Booking state extended on frontend only (`sessionProvider`, `patientPhone`, `contactEmail`).
- `createAppointment()` request payload remains unchanged (no API contract changes).
- Existing booking slot selection, date/time controls, and submit flow preserved.

---

## 2026-04-25 (virtual sessions demo module)

### Files modified
- `frontend/src/app-legacy.js`
- `frontend/src/demo-session-data.js` (new)
- `frontend/src/styles.css`
- `frontend/.env.example`
- `backend/.env.example`
- `frontend/CHANGELOG_UI_WRAP.md`

### What was added
- New visible public route: `#/sessions-demo`.
- New nav links to Sessions Demo (public nav + dashboard/demo cross-links).
- New module sections in Sessions Demo:
  - Upcoming virtual sessions
  - Therapist session controls
  - Patient join instructions
  - Admin/provider status panel
- Session cards now show:
  - patient, therapist, date, time, session type, provider, status
  - actions: Join Zoom, Open Backup Video, Phone Instructions, Copy Link, Mark Complete

### Safety and placeholders
- Added provider config placeholders only (no secrets):
  - `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_ACCOUNT_ID`, `ZOOM_WEBHOOK_SECRET`
  - `DAILY_API_KEY`, `WHEREBY_API_KEY`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - `TELNYX_API_KEY`, `VONAGE_API_KEY`
- Frontend uses `VITE_` prefixed variants for demo detection.
- If Zoom credentials are missing, actions use demo placeholder links and show:
  - `Demo mode: provider credentials pending.`
- Jitsi demo room URL generation is gated by:
  - `VITE_ALLOW_JITSI_DEMO_ROOM=true`

### API/runtime impact
- No new backend API calls introduced for Sessions Demo actions.
- No appointment API contract changes in this pass.
- Demo buttons are frontend-only behavior (window open/copy/prompt/alert + local status updates).

---

## 2026-04-25 (resource license register structure)

### Files added
- `docs/RESOURCE_LICENSE_REGISTER.md`
- `frontend/src/verified-resources.js`

### Files updated
- `frontend/src/app-legacy.js`

### What changed
- Added a conservative resource/license registry dataset with required fields:
  - name, category, official URL, license type, commercial use, signup/API requirements, status, notes.
- Added a matching human-readable register doc with source links used for verification.
- Added a small Sessions Demo section: **Resource & License Register** (preview table only).

### Safety rules applied
- No resource was marked open/commercial without an official source or package license reference.
- Unverified assets default to `MOCK_ONLY_LICENSE_REQUIRED` or `DO_NOT_USE_UNVERIFIED`.
- Signup-gated integrations are marked as placeholders with `credentials pending`.

---

## 2026-04-25 (group sessions pass - demo-safe)

### Files modified
- `frontend/src/booking-wizard.js`
- `frontend/src/app-legacy.js`
- `frontend/src/compliance-gateway.js`
- `frontend/src/demo-session-data.js`
- `frontend/src/styles.css`

### What changed
- Added **Group video session** option in booking step 4 (non-destructive extension).
- Added group-specific fields:
  - participants count
  - role selector (`host`, `co_host`, `participant`)
  - anonymous Plan B toggle
- Captured group fields in booking state on both legacy shell and compliance gateway shell.
- Extended confirmation summary to show group participants/role/anonymous mode.
- Expanded sessions demo data with group session examples and participant rosters.
- Added therapist session control actions for group scenarios:
  - `Mute Participant` (demo action)
  - `Remove Participant` (demo action updates local roster/count)

### Safety / contract impact
- Existing booking steps and back/next flow preserved.
- Existing appointment API payload unchanged.
- Group actions remain frontend demo behavior only (no backend API changes).
