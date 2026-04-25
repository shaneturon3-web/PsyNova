# PsyNova Project Command Center

This folder is a local project-management database for PsyNova planning and execution.
It is designed to sync with Notion when credentials are available.

## Files

- `psynova-command-center.json` - top-level metadata/index
- `modules.json` - module registry
- `tasks.json` - implementation task list
- `integrations.json` - provider integrations/API readiness
- `licenses.json` - resource licensing status
- `competitors.json` - competitor references
- `research.json` - findings and opportunities
- `roadmap.json` - milestone sequencing
- `cursor-prompts.md` - reusable Cursor prompts
- `decision-log.md` - architecture/product decisions
- `changelog.md` - PM system change log

## Notion Setup Guide

## 1) Create a Notion integration

1. Open [Notion integrations](https://www.notion.so/profile/integrations)
2. Create a new internal integration
3. Copy the integration token

## 2) Add token to environment

Set in root `.env` (or export in shell):

```env
NOTION_TOKEN=your_notion_secret
NOTION_PARENT_PAGE_ID=your_parent_page_id
NOTION_MODULES_DATABASE_ID=
NOTION_TASKS_DATABASE_ID=
NOTION_RESEARCH_DATABASE_ID=
NOTION_LICENSES_DATABASE_ID=
```

## 3) Share your parent Notion page

Open your parent page in Notion -> Share -> Invite -> select your integration.

## 4) Set `NOTION_PARENT_PAGE_ID`

Use the page ID from the shared Notion page URL.
If database IDs are empty, the sync script can create databases under this parent page.

## 5) Run sync

```bash
npm run pm:sync:notion
```

## 6) Credential behavior

Without valid credentials, sync is skipped safely.
Expected message:

`Missing NOTION_TOKEN or NOTION_PARENT_PAGE_ID. Local project database created. Notion sync skipped.`
