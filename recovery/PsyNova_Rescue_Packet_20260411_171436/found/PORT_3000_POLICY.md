# Port 3000 policy — PsyNova

**Principle:** one listener on `0.0.0.0:3000` — either the Docker service `backend` **or** local `nest start --watch`, not both.

## What changed in the repo

1. **`docker-compose.yml`** — service `backend` has `profiles: [prod, with-api]` (either name activates the same container).  
   - `docker compose up` starts Postgres, WordPress stack, **without** the API container → host `:3000` stays free for local Nest.  
   - `docker compose --profile prod up` (or `--profile with-api`) starts the API container → it owns `:3000`.

2. **`ops/lunch_autopilot.sh`** — uses `--profile prod` for pull/up so full-stack checks still hit `http://localhost:3000`.

3. **`ops/port_guard_3000.sh`** — run before local dev; fails fast if `:3000` is busy.

4. **`backend` `npm run start:dev`** — runs `port_guard_3000.sh` then `nest start --watch`.

## Daily workflow

| Goal | Commands |
|------|----------|
| Local API + Docker DB/WP | `docker compose up -d` then `cd backend && npm run start:dev` |
| All in Docker | `docker compose --profile prod up -d` (do **not** run local Nest) |

## After reboot

1. `ss -tlnp \| grep 3000` or `lsof -i :3000` — see what owns the port.  
2. Choose mode (table above).  
3. If switching modes: `docker compose stop backend` **or** stop local Nest (Ctrl+C).  
4. `curl -fsS http://localhost:3000/api/health`

## Scripts

- `bash ops/free_port_3000.sh` — diagnostics; suggests stopping Docker backend if it publishes `:3000`.  
- `bash ops/port_guard_3000.sh` — exit `1` if port busy (used by `start:dev`).

[MOCKUP PURPOSE ONLY - NOT REAL DATA]
