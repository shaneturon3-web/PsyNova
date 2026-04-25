# Archive Policy

## Objective

Classify projects into `active`, `archive`, or `unknown` without deleting data.

## Classification Heuristics

- `active`:
  - modified recently, or
  - appears in current roadmap/workstream, or
  - has active git branch activity.
- `archive`:
  - explicit backup/archive path, or
  - superseded duplicate with newer active copy.
- `unknown`:
  - insufficient context, ownership unclear, or compliance/licensing uncertainty.

## Archive Packaging Standard

When archiving later (not in this task):

1. Copy to dated archive folder.
2. Include:
   - source path
   - reason
   - checksum
   - restore instructions
3. Generate `ARCHIVE_MANIFEST.json`.
4. Keep source untouched until restore test succeeds.

## Retention Guidance

- Financial/compliance-sensitive assets: retain long-term.
- Experimental/temp outputs: review quarterly.
- Never archive/delete licensed assets without rights verification record.

## Order Traceability Link

Any archive action approved in the future must reference:
- originating Cursor order file
- paired order output file
- remote sync report file
