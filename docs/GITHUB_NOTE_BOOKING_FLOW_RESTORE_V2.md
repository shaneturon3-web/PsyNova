# Booking flow restore v2

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
`recovery/booking-flow-restore-v2-20260424_195911/`

Revert:
```bash
bash psynova-booking-flow-restore-v2/scripts/revert-booking-flow-restore-v2.sh
```
or manually restore:
```bash
cp recovery/booking-flow-restore-v2-20260424_195911/app.js app/frontend/src/app.js
cp recovery/booking-flow-restore-v2-20260424_195911/styles.css app/frontend/src/styles.css
```
