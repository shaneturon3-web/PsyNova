# Remote/Local Split Protocol

## Purpose

Prevent accidental data loss while organizing projects across local disk and cloud sources.

## Rules

1. Inventory first, classify second, move last.
2. Never move/delete files until:
   - duplicate confirmed,
   - archive target exists,
   - restore path tested.
3. Treat remote sources (Notion/Drive/Dropbox) as separate truth layers.
4. Keep a local-to-remote mapping table before any consolidation.
5. Prefer copy + verify + checksum before any destructive cleanup.
6. Log every consolidation action in a dated migration report.

## Mandatory Columns for Split Decisions

- asset_id
- local_path
- remote_source
- remote_id_or_url
- last_modified_local
- last_modified_remote
- canonical_owner
- action_candidate (`keep_local` / `keep_remote` / `archive` / `review`)

## Forbidden Actions (until explicit approval)

- Bulk delete
- Overwrite newer remote version with older local version
- Move without creating mapping entry
