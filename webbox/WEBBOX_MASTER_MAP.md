# WEBBOX Master Digital Estate Map

Date: 2026-04-25  
Mode: Inventory only (no move/delete operations)

## Scope

This WebBox inventory tracks projects and digital estate inputs from:
- Local hard drive
- PsyNova repo
- Notion inventory (structured placeholder + sync prep)
- Google Drive inventory notes
- Dropbox placeholder
- Old projects / archives

## Structure

- `webbox/inventory/`
  - `local-projects.json`
  - `local-projects.md`
  - `notion-inventory.json`
  - `google-drive-inventory.md`
  - `dropbox-placeholder.md`
- `webbox/reports/`
  - `duplicates.md`
  - `storage-capacity-risk.md`
  - `project-catalog.md`
- `webbox/protocols/`
  - `remote-local-split-protocol.md`
  - `archive-policy.md`
  - `cursor-order-protocol.md`
  - `cursor-operating-rules.md`
  - `remote-reporting-protocol.md`
- `webbox/orders/YYYY-MM-DD/HHMM-order-####.md`
- `webbox/order-outputs/YYYY-MM-DD/HHMM-order-####-output.md`
- `webbox/reports/remote-sync/YYYY-MM-DD/HHMM-sync-report.md`
- `webbox/scripts/`
  - reserved for WebBox-specific helpers
- `webbox/sandbox/`
  - temporary processing area only

## Current State Snapshot

- Local inventory scanner generated 31 detected project roots.
- Duplicate-name clusters and storage risk report generated.
- Multiple PsyNova variants and backups detected (active + archive).
- Cloud-associated paths detected locally:
  - Google Drive
  - Dropbox (path target configured, inventory pending)
  - OneDrive (path target configured, inventory pending)

## Safety Rules Applied

- No files moved.
- No files deleted.
- No runtime logic modified in application modules.
- Inventory/classification only.
- Cursor orders and outputs are now tracked with numbered per-order artifacts.
