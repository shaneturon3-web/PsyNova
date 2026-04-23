# PsyNova short paths (`psynova/`)

- **`platform/`** — symlink to `../virtual-psychology-clinic` (same repo; avoids duplicating the stack).
- **`cos/`** — symlink to `../analista-financiero-clinica-virtual` (COS financial workbook generator).
- **`lib/`** — local npm cache root (`lib/npm_cache`) used by `ops/load_dependencies.sh`.
- **`ops/`** — scripts and `PLOTTER_QUEUE.md`.

Run dependency sync from repository root:

```bash
bash psynova/ops/load_dependencies.sh
```

Docker Compose:

```bash
cd psynova/platform && docker compose up -d --build
```
