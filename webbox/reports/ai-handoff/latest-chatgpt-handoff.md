# WebBox AI Handoff (Latest)

## Current WebBox state

- WebBox scaffold, inventory reports, and Cursor order protocol are in place.
- Order 0001 protocol closure artifacts exist and are committed.

## Current branch

- `feat/compliance-gateway`

## Latest relevant commits

- `6b5c003` - chore(webbox): add cursor order and remote reporting protocol
- `66bb65d` - chore(webbox): add digital estate inventory scaffold and reports
- `3bf19dc` - fix(pm): enforce psy nova notion parent sync safety

## Where order files live

- `webbox/orders/YYYY-MM-DD/HHMM-order-####.md`

## Where output reports live

- `webbox/order-outputs/YYYY-MM-DD/HHMM-order-####-output.md`

## Where remote sync reports live

- `webbox/reports/remote-sync/YYYY-MM-DD/HHMM-sync-report.md`
- `webbox/reports/remote-sync/YYYY-MM-DD/HHMM-order-####-remote-report.md`

## AI/Cursor communication format requested by Shane

- Cursor orders must be copyable blocks only.
- Cursor must return compact status tokens:
  - `PASS`
  - `FIXED`
  - `FAILED`
  - `NEED`
  - `MISSING`
  - `ACTION REQUIRED`
- Desired operator flow: Shane should only need to say “Cursor completed” after future tasks.
