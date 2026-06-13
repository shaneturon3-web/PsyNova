---
title: "PsyNova Virtual Clinic — Unified Progress Report"
subtitle: "Platform (virtual-psychology-clinic) + Financial modeling (COS)"
date: "April 10, 2026"
documentclass: article
geometry: margin=1in
fontsize: 11pt
progressive_number: 1
doc_control_id: "PSYNOVA-PR-001"
---

**Document control:** `PSYNOVA-PR-001` · **Progressive No.** 001 *(increment on each issued revision)*

---

## 1. Purpose

This document merges progress for **two workstreams** under **PsyNova Virtual Clinic**:

1. **Platform** — `virtual-psychology-clinic`: telepsychology product (frontend, NestJS API, WordPress, Docker, PostgreSQL).
2. **Financial / COS** — `analista-financiero-clinica-virtual`: Clinical Operations System (COS) Excel workbook generator and related CSVs.

Status is **as documented in repository** as of the report date.

## 2. Executive summary

| Workstream | Summary |
|------------|---------|
| **Platform** | Architecture and dev stack are defined; Docker-based local stack, NestJS API, Vite frontend, WordPress, health/docs endpoints, and operational runbooks (port policy, migrations, deployment notes) are in place. Phased timeline (architecture through launch) is specified in product README. |
| **COS** | Publisher-grade financial workbook build: multi-sheet model, infrastructure/CAPEX linkage, scenarios, dashboard `Input_Variables`, print summary, `MODEL.csv` export, sheet protection, and institutional naming. |

Cross-cutting themes: **Québec Law 25** and **PIPEDEA / HIPAA-aligned** positioning in platform docs; **Law 25 budget placeholder** in COS until legal/ops sets amounts.

## 3. Platform workstream (`virtual-psychology-clinic`)

### 3.1 Product scope (from README)

- Secure, multilingual, AI-assisted **virtual psychology** offering: teletherapy, patient portal, booking/billing, EHR-oriented features, invoicing, WCAG 2.1 target.
- **Languages:** EN/FR services; ES interface/assistant where applicable.
- **Stack:** WordPress, Node.js (NestJS), PostgreSQL, AWS Canada, Stripe, Zoom Healthcare, SendGrid, OpenAI/Claude (as listed in README).

### 3.2 Engineering baseline

- **Local run:** Docker Compose for DB + WordPress; API either on host (`npm run start:dev`, port **3000**) or in container (`--profile prod` / `with-api`). Documented **port 3000 exclusivity** (see `ops/PORT_3000_POLICY.md`).
- **Endpoints (dev):** `GET /api/health`, Swagger at `/api/docs`, WordPress on `:8080`, Vite UI on `:5173` with proxy to API.
- **Quality / ops:** E2E test command documented; batch DB migrate script; migration helpers for legacy DB volumes (`password_hash`, `service_category`, notes/contact SQL).
- **Docs:** Master brief (`docs/SPEC_MAQUETTE_PSYnova_Master_BRIEF_v01.md`), deployment notes (`docs/DEPLOYMENT.md`).

### 3.3 Platform — open / follow-up

- Live **operational data** and production cutover remain outside this static report; follow README and deployment docs for environment-specific steps.
- **Placeholder / mockup** content is explicitly flagged in project materials; replace before production use where applicable.

## 4. COS workstream (`analista-financiero-clinica-virtual`)

### 4.1 Completed deliverables

| Area | Status |
|------|--------|
| Workbook generator (`build_prelaunch_workbook.py`) | Operational; single command build |
| Core sheets (INPUTS, MODEL, OPERATING_COSTS, ROSTER, TIERS, etc.) | Implemented |
| `INFRASTRUCTURE_ASSETS` + CSV ingestion | Implemented; rolls to partnership / CAPEX |
| `CAPEX_SUMMARY` (Total Initial Valuation, Architect contribution link) | Implemented |
| `PARTNERSHIP_STRUCTURE` ownership math | Implemented |
| `DASHBOARD` + `Input_Variables` (ADJUSTMENT_RESERVE via `N38`) | Implemented; read-only except control cell |
| `PRINT_SUMMARY` + print styling | Implemented |
| Health check module | Implemented |
| Repository: `LICENSE.md`, `README.md`, `SYSTEM_LOG.md`, `CONTRIBUTOR_LICENSE.txt` | Present |

### 4.2 Technical baseline

- **Build:** `python -m analista_financiero_clinica_virtual` → `output/ANALISIS_FINANCIERO_PRE_LAUNCH.xlsx` and `output/MODEL.csv`.
- **Protection:** Sheet protection with hashed password (`WORKBOOK_SHEET_PASSWORD` in source); replace before external distribution.
- **Financial logic:** Clinic margin stack, operating load (incl. hybrid director pay), Partner_L_Draw, tax, **ADJUSTMENT_RESERVE**, solvency / redemption messaging, benchmark ghost rows labeled **Market Benchmark [QC_2026_DATA]** where applicable.

### 4.3 COS — open / follow-up

- **Law 25:** Expense line remains placeholder until legal/ops sets recurring privacy-program cost (`[PENDING_DATA]`).
- **Operational inputs:** Multiple INPUTS rows remain `[PENDING_DATA]` for live clinic parameters (utilization, roster, supervision, etc.).
- **Distribution:** Rotate workbook protection password; align with executed contributor/license agreements where required.

## 5. Unified conclusion

- **Platform** progress is measured by **runnable stack + documented procedures**; go-live depends on environment configuration, content, and regulatory completion beyond this report.
- **COS** meets the **pre-launch financial modeling** objective: reproducible builds, traceable CAPEX/infrastructure linkage, and controlled dashboard input for stress-testing.

---

*Confidential — internal progress report. Compiled from `virtual-psychology-clinic/README.md` and COS repository sources.*
