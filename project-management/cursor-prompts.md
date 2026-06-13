# Cursor Prompt Library

## Booking QA Prompt

Verify booking flow steps end-to-end:
- time slot selection
- back navigation
- session type/provider summary
- no crash on submit fallback

## Virtual Sessions Prompt

Implement provider-agnostic virtual session cards with:
- status pill
- join/copy controls
- fallback behavior with missing credentials
- demo-safe local state updates only

## Licensing Prompt

Update verified resource register:
- never assume open/commercial rights
- unknown => `MOCK_ONLY_LICENSE_REQUIRED`
- include official source URL and verification notes

## Notion Sync Prompt

Sync project-management JSON to Notion via upsert-only behavior:
- create databases if IDs missing and parent exists
- no delete operations
- log each upsert
