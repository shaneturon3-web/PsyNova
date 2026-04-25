# PsyNova booking flow restore

Restores the pre-Studio booking UX before the HTML/cloud interface redo.

Apply from the repository root:

```bash
unzip psynova-booking-flow-restore.zip
bash psynova-booking-flow-restore/scripts/apply-booking-flow-restore.sh
cd app/frontend
npm run dev
```

Revert:

```bash
bash psynova-booking-flow-restore/scripts/revert-booking-flow-restore.sh
```

Expected behavior:
1. A specialty button opens `#/book`.
2. The selected specialty pre-fills the booking wizard.
3. Book appointment can also be opened directly.
4. Calendar and time selector stay in the booking panel, side by side on desktop.
5. Login is requested only after the patient presses final confirm.
