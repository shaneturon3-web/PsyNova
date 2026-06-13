# Clinical Operations System (COS) — Framework v1.0

Python tooling that generates a locked, multi-sheet Excel workbook for Quebec-facing clinical operations: roster economics, operating costs, partnership ownership, scenario analysis, and publisher-grade print extracts.

## System architecture

- **Build entrypoint:** `python -m analista_financiero_clinica_virtual`  
  Produces `output/ANALISIS_FINANCIERO_PRE_LAUNCH.xlsx` and a flat `output/MODEL.csv` export of the **MODEL** sheet.

- **Primary sheets (institutional naming):**  
  `INPUTS`, `TIERS`, `ROSTER`, `OPERATING_COSTS`, `INFRASTRUCTURE_ASSETS`, `CAPEX_SUMMARY`, `PARTNERSHIP_STRUCTURE`, `MODEL`, `SCENARIOS`, `SCENARIO_B_LIGHT`, `PARTNER_L_COVERAGE`, `EXPENSES`, `DASHBOARD`, `PRINT_SUMMARY`.

- **CAPEX:** `INFRASTRUCTURE_ASSETS.csv` loads into `INFRASTRUCTURE_ASSETS`; `CAPEX_SUMMARY!B3` equals that total (Architect system contribution = same link). `INPUTS` B25–B26 reference those cells.

- **DASHBOARD:** All cells are locked except **`N38`** (`Input_Variables` / **ADJUSTMENT_RESERVE**), which feeds `INPUTS` and the MODEL stack.

- **Data inputs:**  
  `INFRASTRUCTURE_ASSETS.csv` (line-item effort valuation) and `INITIAL_CAPITAL_VALUATION.csv` (rollup). Legacy filenames are accepted as fallback during migration.

- **Protection:** All sheets are protected with a hashed password defined in `build_prelaunch_workbook.py` as `WORKBOOK_SHEET_PASSWORD`. Replace this value and rebuild before distributing outside a controlled environment.

## Law 25 compliance

The workbook includes a placeholder expense line for **Law 25** (Quebec privacy) privacy-program costs. Numeric values are marked `[PENDING_INPUT]` until legal and technical scoping sets the recurring amount. Operational handling of personal information remains outside this repository; this module only reserves a budget line consistent with financial planning.

## Financial modeling logic

- **Margin stack:** Director clinic share and roster clinic share roll into total clinic margin; operating load includes Jane/marketing stack, hybrid director pay (admin plus clinical pay), supervision, and legacy fees as modeled.  
- **Partner_L_Draw** is applied before tax; **ADJUSTMENT_RESERVE** is the last lever on net profit (manual value or formula).  
- **Solvency and redemption:** The model surfaces insolvency warnings and redemption-alert text when final net falls below the configured draw.  
- **Benchmark ranges:** Ghost rows use the label **Market Benchmark [QC_2026_DATA]** for reference bands; actuals remain editable in adjacent rows.

## Requirements

- Python 3.11+ recommended  
- Dependencies: `openpyxl` (see project environment)

## License

See `LICENSE.md`. Use is restricted to parties authorized by The Architect or the holding entity.
