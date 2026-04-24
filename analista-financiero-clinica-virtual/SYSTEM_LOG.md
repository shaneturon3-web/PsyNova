# System Log — Clinical Operations System (COS)

Architectural milestones (technical record only).

| Date | Milestone |
|------|-----------|
| 2026-Q2 | Workbook generator (`build_prelaunch_workbook.py`) established: multi-sheet financial model with INPUTS-driven parameters. |
| 2026-Q2 | Institutional sheet naming: `INFRASTRUCTURE_ASSETS`, `PARTNERSHIP_STRUCTURE`, `PARTNER_L_COVERAGE`, `CAPEX_SUMMARY`. |
| 2026-Q2 | CSV ingestion for infrastructure line items; totals roll into partnership contribution and CAPEX baseline. |
| 2026-Q2 | `CAPEX_SUMMARY` added: Total Initial Valuation linked to infrastructure sum; Architect system contribution line mirrors valuation. |
| 2026-Q2 | `MODEL` stack: clinic margin, operating load, Partner_L_Draw, tax, `ADJUSTMENT_RESERVE`, net profit, solvency and redemption flags. |
| 2026-Q2 | `DASHBOARD` publisher layout with `Input_Variables` cell (`N38`) driving `ADJUSTMENT_RESERVE` through INPUTS; sheet protection with review password. |
| 2026-Q2 | `PRINT_SUMMARY` export block; flat `MODEL.csv` snapshot for audit. |
| 2026-Q2 | Law 25 placeholder line reserved in expense bridge pending legal scoping. |

*This log is append-only for release traceability.*
