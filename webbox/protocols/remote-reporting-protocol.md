# Remote Reporting Protocol

## Objective

Ensure each Cursor order produces a machine-readable and human-readable remote sync trace.

## Required Output

For each order:
- `webbox/reports/remote-sync/YYYY-MM-DD/HHMM-sync-report.md`

## Required Sections

- Order number
- Timestamp
- Baseline commit
- Current branch
- Pre-change tree status
- Artifacts created/modified
- External system interactions attempted (Notion/Drive/Dropbox/etc.)
- Success/failure summary
- Blocking issues
- Next required remote input

## Safety Controls

- Never report an external sync as complete without explicit tool output evidence.
- If credentials or access are missing, mark sync status as `blocked` and include next action.
- If target remote structure is incorrect, stop and log mismatch before writing additional data.
