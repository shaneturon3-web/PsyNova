# Cursor Order Protocol

## Purpose

Provide strict traceability for AI-to-Cursor execution orders in WebBox.

## Required Pattern

1. Every order has a unique incremental number (`0001`, `0002`, ...).
2. Every order is saved as its own file:
   - `webbox/orders/YYYY-MM-DD/HHMM-order-####.md`
3. Every order has a paired output file:
   - `webbox/order-outputs/YYYY-MM-DD/HHMM-order-####-output.md`
4. Every order execution generates a sync report:
   - `webbox/reports/remote-sync/YYYY-MM-DD/HHMM-sync-report.md`
5. If an order touches multiple projects, add a per-project copy or summary in each project’s governance/docs area.
6. Orders must not be stored in active runtime source directories.
7. Temporary processing must be done in `webbox/sandbox/`.

## Naming Rules

- Keep the same date and time prefix across order/output/report when possible.
- Use 24h local time (`HHMM`).
- Do not overwrite previous order files.

## Execution Closure Checklist

- Baseline commit logged
- Branch logged
- Pre-change tree status logged
- Files created/modified logged
- Reports generated and paths logged
- Open questions captured
- Next order recommendation captured
