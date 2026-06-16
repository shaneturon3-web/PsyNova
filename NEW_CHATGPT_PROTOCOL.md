# New ChatGPT Protocol — PsyNova (Terminal-Authorized Continuity)

Tag: `[MOCKUP PURPOSE ONLY - NOT REAL DATA]`

Purpose: This document lets a new ChatGPT session continue the same operating protocol used previously, in the same authorized terminal context, without exposing secrets in chat.

---

## 1) Operating mode (must follow)

Execution model:
- Inspect first, then implement.
- Do not claim success without terminal evidence.
- Do not overwrite prior reports.
- Keep one authority on port 3000 (Docker API or local Nest, never both at once).
- If evidence is missing, report exactly: `FALTA DE EVIDENCIA`.

Required output sections for each major step:
1. `VERIFIED_STATE`
2. `BLOCKERS`
3. `SAFE_NEXT_ACTION`
4. `EXACT_COMMANDS_TO_RUN`

Human handshake line:
- `OK for Next Step o pega la FALLA`

If no error:
- Human replies `OK`

If error:
- Human pastes only the error output.

---

## 2) Credential policy (already authorized terminal)

Assumption:
- This terminal/session is already authorized for the required services.

Hard rules:
- Never print secret values in chat.
- Never commit `.env` or credential files.
- Only verify that credentials exist and are loadable.

Credential existence checks (safe):

```bash
cd /workspace

# Backend env file presence
test -f app/backend/.env && echo "OK: app/backend/.env exists" || echo "MISSING: app/backend/.env"

# Check key names exist (not values)
for k in JWT_SECRET DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD; do
  if rg -n "^${k}=" app/backend/.env >/dev/null; then
    echo "OK: ${k} present"
  else
    echo "MISSING: ${k}"
  fi
done

# Optional translation keys (at least one optional)
for k in DEEPL_API_KEY GOOGLE_TRANSLATE_API_KEY; do
  if rg -n "^${k}=" app/backend/.env >/dev/null; then
    echo "FOUND (optional): ${k}"
  else
    echo "NOT SET (optional): ${k}"
  fi
done
```

Note:
- Existence check is enough for protocol continuity.
- Do not echo or copy actual secret contents.

---

## 3) Where to store data (single source of truth)

Repository root:
- `/workspace`

Operational logs and reports:
- `app/ops/logs/` (runtime logs/check outputs)
- `app/ops/SESSION_CHANGELOG.md` (increment-by-increment changelog)
- `app/ops/AUDIT_INCREMENT_REPORT.md` (external-audit oriented report)
- `reports/` (verified state snapshots and summaries)
- `registry/` (fix records and execution evidence bundles)

Protocol and handoff references:
- `recovery/PsyNova_Rescue_Packet_20260411_171436/found/SHANE Profiles.README`
- `reports/PSYNOVA_VERIFIED_STATE_20260411_183213/CURSOR_EXECUTION_PROTOCOL.md`
- `app/tools/Shane's Armyknives/PAIR_01_ORDER_INTERPRETATION_ACTIONS_v01.txt`
- `app/tools/Shane's Armyknives/PAIR_02_RESOURCES_RESULTS_AUDIT_PROMPT_v01.txt`
- `docs/GOOGLE_AI_STUDIO_HANDOVER.md`

Do not store secrets in:
- markdown reports
- git-tracked logs
- chat transcripts

---

## 4) Runtime topology and port coordination

Canonical dev ports:
- Backend API (Nest): `3000`
- Frontend (Vite): `5173`
- Swagger: `http://localhost:3000/api/docs`
- Health: `http://localhost:3000/api/health`

Single-owner rule for `:3000`:
- Either Docker backend owns port 3000
- Or local `npm run start:dev` owns port 3000
- Never run both at the same time.

Helpers:
- `app/ops/port_guard_3000.sh`
- `app/ops/free_port_3000.sh`
- `app/ops/stack_batch_db_migrate_v01.sh`
- `app/ops/advance_loop.sh` (calls `auto_pipeline.sh`)

---

## 5) Node/npm environment loading rule

Before npm/node commands in automation/sudo/non-interactive contexts:

```bash
cd /workspace
source app/ops/load_node_env.sh
node -v && npm -v
```

Why:
- `app/ops/load_node_env.sh` enforces NVM loading and fails fast if Node/npm are unavailable.

---

## 6) Standard execution loop (same as old ChatGPT)

For each increment:
1) State technical hypothesis.
2) Apply minimal safe change.
3) Validate (build/test/lint/runtime).
4) Write evidence to changelog/report.
5) Adjust directive if needed and continue.

Mandatory close line:
- `Proxima accion para Shane`

If validation fails:
- include exact error and mitigation
- continue from smallest safe next action

---

## 7) Quick start command set (copy/paste)

```bash
cd /workspace
source app/ops/load_node_env.sh
bash app/ops/port_guard_3000.sh
bash app/ops/run_backend_checks.sh --skip-install
```

Frontend build validation:

```bash
cd /workspace/app/frontend
npm run build
```

If DB/API stack needs refresh:

```bash
cd /workspace/app
docker compose up -d
```

---

## 8) Reporting template (compact)

Use this exact structure:

```text
VERIFIED_STATE:
- ...

BLOCKERS:
- ...

SAFE_NEXT_ACTION:
- ...

EXACT_COMMANDS_TO_RUN:
- ...

OK for Next Step o pega la FALLA
```

Section-close summary (when meaningful progress is reached):
- `Overall readiness: ~X%`
- `Delta since last report: +Y%`
- `tasks: ~A of ~130`
- `Current blockers: ...`
- `Next actions: ...`

---

## 9) Safety and compliance reminders

- Project is mockup-only; keep `[MOCKUP PURPOSE ONLY - NOT REAL DATA]` framing.
- Do not claim real clinical operations.
- Do not fabricate endpoint availability; mark unavailable modules as gray/not connected.
- Treat legal/compliance text as draft unless formally validated.

---

## 10) First message for a new ChatGPT session

Paste this:

```text
Use /workspace/NEW_CHATGPT_PROTOCOL.md as the operating protocol.
Assume this terminal is already authorized.
Do credential existence checks only (no secret disclosure).
Run in execution-first mode with compact reporting:
VERIFIED_STATE, BLOCKERS, SAFE_NEXT_ACTION, EXACT_COMMANDS_TO_RUN.
Enforce single owner for port 3000 and continue with the minimal safe next action.
```

