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

## Build

_Updated after `npm run build` (2026-04-24, visible pass)._

```
> psynova-frontend@0.1.0 build
> vite build

vite v5.4.21 building for production.
✓ 20 modules transformed.
dist-psynova/index.html                  0.58 kB │ gzip:  0.40 kB
dist-psynova/assets/index-DnhOd-X8.css  29.75 kB │ gzip:  6.67 kB
dist-psynova/assets/index-BvpCw32Z.js   95.77 kB │ gzip: 26.61 kB
✓ built in ~1.44s
```

**Exit code:** 0
