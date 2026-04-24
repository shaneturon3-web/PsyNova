# STUDIO_UPLOAD_ORDER.md

Paste into Google AI Studio in this order (each block is one upload or one chat attachment).

1. **`STUDIO_ORIENTATION.md`** (single file from this folder) — establishes canonical path, real stack, and “no rebuild from scratch.”
2. **`STUDIO_FIRST_MESSAGE.md`** — short correction message; paste as the first user message after attaching bundles.
3. **`INDEX.md`** — full file list + descriptions so the model knows what exists.
4. **`DOCS_BUNDLE.md`** — handover, architecture, mockup spec, `FILES_FOUND` content in one paste.
5. **`BACKEND_BUNDLE.md`** — Nest API source (auth + appointments + bootstrap).
6. **`FRONTEND_BUNDLE.md`** — Vite + vanilla JS (largest paste last).

**Optional:** If the tool has a character limit, split `FRONTEND_BUNDLE.md` at `===== FILE:` boundaries only; do not merge or rewrite code.

**Repo handover prompt:** After the above, use **Section 8** in `docs/repo/GOOGLE_AI_STUDIO_HANDOVER.md` (included inside `DOCS_BUNDLE.md`) as the system instruction.
