# Booking flow restore (inline split, login after confirm)

## Active frontend entry

- `app/frontend/index.html` loads `/src/main.js` → `src/app.js` → by default `src/app-legacy.js` (`VITE_SPA_MODE` defaults to `legacy`, not `gateway`).

## What changed

1. **Removed** the `psynova_booking_bridge` IIFE that lived in `src/app.js`. It replaced the entire `#app` root and conflicted with the real router.
2. **`src/booking-wizard.js`** — Booking UI is a **split layout**: left = visit reason / selected specialty context, right = **calendar first**, then time slots, then session format, then confirm. Free-text “notes” and any API fields for session notes were removed from this flow so the mock app does not store that content.
3. **`src/app-legacy.js`** — Service page “specialty” items are **buttons** with `data-booking-category` that open `#/book` with the category and **step 2 (calendar)**. Choosing a category inside the wizard also jumps to step 2. Unauthenticated **Confirm** saves the draft to `sessionStorage` and routes to **`#/login`** (not register). `createAppointment` is called without `sessionNotes` / `sessionNotesClientLanguage`.
4. **`src/compliance-gateway.js`** — Same booking click/submit behavior for gateway mode.
5. **`src/styles.css`** — `.booking-inline-split` and `button.service-card` rules.
6. **`src/i18n.js`** — `services_lead` copy updated to match open booking before sign-in.

## Backup (revert)

Unmodified copies are in:

`recovery/BOOKING_FLOW_RESTORE_2026-04-24/app-frontend/src/`

Restore by copying those files over (from the backup tree into `app/frontend/src/`):

- `app.js`
- `app-legacy.js`
- `booking-wizard.js`
- `compliance-gateway.js`
- `styles.css`

Also copy `i18n.js` if you need the previous `services_lead` strings (optional).

Then remove or hand-revert this doc if desired.

## Markers in source

Search for `BOOKING_FLOW_RESTORE_START` in `app.js` and `app-legacy.js`, and `BOOKING_FLOW_RESTORE` in `booking-wizard.js` / `styles.css`.

## Manual acceptance checks

- **Services** → click a service card → `#/book` with calendar on the right and specialty on the left.
- **Nav “Book”** / hero book CTA (default `#/book`) → same wizard.
- Select a date → **Continue** → hours appear; picking an hour does not send you to login.
- **Confirm** without being signed in → **login** page; after sign-in, return to draft via existing `SS_RETURN` + `psynova_booking_draft` handoff.
