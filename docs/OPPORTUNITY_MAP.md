# PsyNova Opportunity Map

Date: 2026-04-25  
Purpose: Convert recurring market complaints into concrete PsyNova build modules.

## Complaint -> Solution -> Module

| Complaint | PsyNova Solution | Module |
|---|---|---|
| Bad UX / clunky workflows | Modern UI wrap, cleaner navigation, role-specific screens | frontend |
| Pricing confusion | Transparent pricing calculator and add-on impact preview | billing engine |
| Expensive scaling for group clinics | Usage-tier controls + team license optimizer | admin + billing |
| Weak telehealth reliability | Multi-provider session routing + fallback chain | virtual sessions |
| Video session failures | Zoom primary + backup video (Daily/Whereby/Jitsi) + phone fallback | virtual sessions |
| Too much manual insurance work | Claims pipeline with statuses, denials queue, retry actions | insurance/billing ops |
| Poor reporting depth | Operational dashboards (utilization, no-show risk, cashflow risk) | analytics |
| Support is slow / no escalation | In-app critical escalation flow with SLA markers | support ops |
| Feature gating frustration | Core baseline bundle + optional advanced packs (clear boundaries) | product packaging |
| Weak bulk actions | Bulk reschedule/reminders/claim updates with audit logs | admin ops |
| Duplicate data entry | Shared intake schema + auto-prefill across workflows | intake/forms |
| Poor patient communication | Unified reminders (email/SMS), templates, and delivery tracking | communications |
| Confusing billing outcomes for patients | "Why this charge?" billing breakdown + insurer/patient split | patient billing UX |
| Hard to manage follow-ups | Post-session automations: tasks, reminders, outcome forms | follow-up engine |
| Limited marketing tools | CRM pipeline + referral tracking + ads attribution | growth engine |
| Limited patient engagement between sessions | Wellness content, journaling prompts, habit check-ins | wellness hub |
| Low retention and missed appointments | No-show prediction + smart reminder cadence | retention engine |
| Limited therapist productivity tools | Session prep panel, template library, AI-assisted note workflows | therapist workspace |
| Unclear provider compliance readiness | Credential/status panel + environment readiness checks | compliance/admin |
| Poor integration ecosystem | Plugin-style connector layer and marketplace-ready interfaces | integrations marketplace |

## Quick Priority View

### P0 (Immediate)
- frontend
- virtual sessions
- communications
- follow-up engine
- therapist workspace

### P1 (Near-term)
- insurance/billing ops
- analytics
- admin ops
- patient billing UX
- retention engine

### P2 (Expansion)
- growth engine
- wellness hub
- integrations marketplace
- product packaging

## Vertical Flow Coverage (Booking -> Session -> Follow-up)

- **Booking:** frontend + intake/forms + communications
- **Session:** virtual sessions + therapist workspace + compliance/admin
- **Follow-up:** follow-up engine + wellness hub + retention engine + analytics
