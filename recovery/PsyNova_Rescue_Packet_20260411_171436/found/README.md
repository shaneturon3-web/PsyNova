# PsyNova Virtual Clinic

## Virtual Psychology Platform – Montréal, Québec

### Executive Summary

PsyNova is a secure, multilingual, AI-powered virtual psychology clinic designed to deliver high-quality mental health services across Québec. Built for scalability and regulatory compliance, the platform provides teletherapy, electronic records, secure messaging, and intelligent automation.

---

### Key Features

* Online-only telepsychology services
* Secure patient portal
* Online booking and billing
* AI-powered multilingual assistant
* Electronic health records
* Insurance-ready invoicing
* WCAG 2.1 accessibility compliance

---

### Languages

* English
* French
* Spanish (interface and assistant only)

**Note:** Psychological services are delivered exclusively in English and French.

---

### Compliance

* Québec Law 25
* PIPEDA
* HIPAA-aligned safeguards
* Canadian data residency

---

### Technology Stack

* WordPress
* Node.js (NestJS)
* PostgreSQL
* AWS Canada
* Stripe
* Zoom Healthcare
* SendGrid
* OpenAI / Claude

---

### Estimated Monthly Costs

| Scenario         | Monthly Cost |
| ---------------- | ------------ |
| 1 Psychologist   | $218         |
| 3 Psychologists  | $498         |
| 10 Psychologists | $1,393       |

---

### Development Timeline

* Phase 1: Architecture (Weeks 1–3)
* Phase 2: Core Development (Weeks 4–7)
* Phase 3: AI Integration (Weeks 8–10)
* Phase 4: Compliance (Weeks 11–12)
* Phase 5: Launch (Weeks 13–14)

---

### Governance

**Project Manager:** Shane Osante Turon
**Development Platform:** Cursor AI IDE

---

### Disclaimer

All placeholder materials in this document are labeled:

**[MOCKUP PURPOSE ONLY – NOT REAL DATA]**

---

### Brief maquette (contenu complet frontend + backend + légal)

Spécification prête pour équipe dev ou IA : [`docs/SPEC_MAQUETTE_PSYnova_Master_BRIEF_v01.md`](docs/SPEC_MAQUETTE_PSYnova_Master_BRIEF_v01.md) (FR/EN, OPQ / Loi 25, i18n, personnages fictifs, phases).

### Implementation Quick Start

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose down -v
```

**Port 3000 rule (persistent):** only **one** process may listen — either the Docker API container **or** local NestJS, never both. Details: `ops/PORT_3000_POLICY.md`.

**Option A — DB + WordPress in Docker; API on the host (typical dev):**

```bash
docker compose up --build -d
cd backend && npm install && npm run start:dev
```

**Option B — Full stack in Docker (API in container on :3000):**

```bash
docker compose --profile prod up --build -d
```

(`--profile with-api` is equivalent — same service, two profile labels for compatibility.)

Optional: add `COMPOSE_PROFILES=prod` (or `with-api`) to your `.env` so plain `docker compose up` includes the backend (only if you do **not** run local `npm run start:dev`).

Backend health endpoint (when API is running):

- `GET http://localhost:3000/api/health`
- `API Docs: http://localhost:3000/api/docs`
- `WordPress (local): http://localhost:8080`

---

### Backend Test Commands

```bash
cd backend
npm install
npm run test:e2e
```

### Batch script (DB + migrate + optional API)

```bash
bash ops/stack_batch_db_migrate_v01.sh
# optional: also start Docker backend and wait for /api/health
bash ops/stack_batch_db_migrate_v01.sh --with-api
```

(`--with-api` means “also start the API container”; the script uses Compose profile `prod`.)

### Database: `password_hash` missing on existing volumes

If you see `column "password_hash" of relation "users" does not exist`, your Postgres volume predates the column. Apply once (with `psynova-db` running: `docker compose up -d db`):

```bash
bash ops/migrate_db_password_hash.sh
```

In `.env`, quote values that contain spaces (e.g. `WP_SITE_TITLE="PsyNova Virtual Clinic"`) so shell tools do not mis-parse the file.

If Docker returns `permission denied` on the socket, either use `sudo docker compose ...` or add your user to the `docker` group (`sudo usermod -aG docker "$USER"`, then sign out/in). The migration script retries with `sudo` when plain `docker` fails.

Or reset dev data: `docker compose down -v` (destructive) then `docker compose up -d` so init scripts run on a fresh volume.

### Database: `service_category` on existing volumes (DRAFT booking)

If `appointments` predates the DRAFT category column, apply once (DB running):

```bash
docker compose exec -T db psql -U "${DB_USER:-psynova}" -d "${DB_NAME:-psynova}" -f - < database/04-alter-appointments-service-category.sql
```

(Or run the SQL manually.) New volumes pick it up from `docker-entrypoint-initdb.d`.

### Frontend + API (dev)

From `frontend/`, `npm run dev` loads the UI at `http://localhost:5173`. API calls use same-origin `/api`; Vite proxies to `http://127.0.0.1:3000`, which avoids browser CORS issues (`Failed to fetch`). Ensure the Nest API is listening on port **3000**.

### Deployment (mockup / Phase 1)

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for Vercel-style hosting, environment variables (translation APIs, CORS), and keeping mockup disclaimers visible.

### Database: notes + contact table on existing volumes

If your Postgres volume was created before `07-notes-and-contact.sql`, apply once:

```bash
docker compose exec -T db psql -U "${DB_USER:-psynova}" -d "${DB_NAME:-psynova}" -f - < database/07-notes-and-contact.sql
```
