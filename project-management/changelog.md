# Project Management Changelog

## 2026-04-25

- Initialized `project-management/` command center structure.
- Added module/task/integration/license/competitor/research/roadmap datasets.
- Added Notion sync scaffold requirements and documentation.
- Pending: run sync script with real Notion credentials.

## 2026-04-25 (Notion sync prep pass)

- Created files:
  - `project-management/README.md`
  - `project-management/psynova-command-center.json`
  - `project-management/modules.json`
  - `project-management/tasks.json`
  - `project-management/integrations.json`
  - `project-management/licenses.json`
  - `project-management/competitors.json`
  - `project-management/research.json`
  - `project-management/roadmap.json`
  - `project-management/cursor-prompts.md`
  - `project-management/decision-log.md`
  - `scripts/sync-to-notion.js`
  - `.env.example`
  - `package.json`
- Notion sync status:
  - `npm run pm:sync:notion` executed successfully without credentials.
  - Output: `Missing NOTION_TOKEN or NOTION_PARENT_PAGE_ID. Local project database created. Notion sync skipped.`
- Build result:
  - Frontend build passed: `npm run build` in `app/frontend`.

## 2026-04-25 (Notion parent-page safety + structure fix)

- Updated `scripts/sync-to-notion.js`:
  - Added parent-page logging (`NOTION_PARENT_PAGE_ID`, detected parent title).
  - Added created/existing database logs with IDs, names, and Notion URLs.
  - Added PsyNova-only database safety rule (refuse non-`PsyNova*` DB titles).
  - Added child database creation/sync under parent page for:
    - PsyNova Modules
    - PsyNova Tasks
    - PsyNova Roadmap
    - PsyNova Integrations
    - PsyNova Licenses
    - PsyNova Research
    - PsyNova Decisions
    - PsyNova Cursor Prompts
    - PsyNova Changelog
  - Added explicit note that generic Projects DB is ignored unless explicitly mapped.
- Updated `.env.example`:
  - Added additional Notion DB ID variables.
  - Added guidance to comment out wrong DB IDs and force recreation under parent page.
- Sync run result (`npm run pm:sync:notion`):
  - Failed with `object_not_found` for current parent page ID.
  - Integration access/share to target page must be fixed before database creation/sync can proceed.
