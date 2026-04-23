# STUDIO_FIRST_MESSAGE.md — paste into Google AI Studio

Copy the block below into a new chat (after uploading **`AI_STUDIO_RECOVERY_BUNDLE.zip`** or the bundle folder).

---

The workspace you were using before was **not** the real PsyNova codebase. The files attached here are **raw exports** from the canonical repository at **`/home/shane/PsyNova`**.

**Instructions:**

1. Treat these files as the **authoritative baseline** for PsyNova (NestJS backend under `app/backend`, Vite + **vanilla JavaScript** frontend under `app/frontend` — there is **no** `App.tsx` and no `routes/` / `components/` tree under `src/`).
2. **Do not** regenerate the architecture, stack, or folder layout from scratch. **Do not** assume React unless you see React dependencies in the exported `package.json` files (the frontend only lists Vite).
3. Read **`STUDIO_ORIENTATION.md`** and **`FILES_FOUND.md`** in the bundle for what exists vs what was missing from generic templates.
4. Primary SPA entry: **`app/frontend/src/main.js`** → **`app/frontend/src/app.js`**. API client: **`app/frontend/src/api.js`**.

If something is not in the bundle, it still lives in the full clone under `/home/shane/PsyNova` — ask for specific paths instead of inventing files.

---
