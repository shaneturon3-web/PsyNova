# Missing Secrets Check

- Real `.env` files are excluded by `.gitignore`.
- `.env.example` files are retained.
- Redacted env snapshots in:
  - `registry/PSYNOVA_DB_ALIGN_20260411_185005/01_env.txt`
  - `registry/PSYNOVA_FIX_DB_20260411_184053/02_backend_env.txt`
- Added pre-push scanner: `scripts/prepush_secret_scan.sh`

## Pre-push procedure
1. Run `bash scripts/prepush_secret_scan.sh`
2. If matches appear, redact or remove sensitive content before pushing.
3. Re-run scanner until clean.
