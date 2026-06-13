# PsyNova .dev Phase Start

Date: Fri 12 Jun 2026 10:12:42 PM EDT

STATUS=PHASE_DEV_STARTED
CANONICAL_CANDIDATE=/home/shane/Projects/PsyNova_FRESH_20260612_214251
RECOVERY_COMMIT=47feaa0
RECOVERY_ARCHIVE=/home/shane/Recovery/PsyNova/PsyNova_FRESH_RecoveryPoint_20260612_215901.tar.gz
RECOVERY_REPORT=/home/shane/Downloads/Reports/PsyNova_RecoveryPoint_20260612_215901_v01.md

## Locked recovery state

Canonical candidate:
  /home/shane/Projects/PsyNova_FRESH_20260612_214251

Recovery archive:
  /home/shane/Recovery/PsyNova/PsyNova_FRESH_RecoveryPoint_20260612_215901.tar.gz

Recovery report:
  /home/shane/Downloads/Reports/PsyNova_RecoveryPoint_20260612_215901_v01.md

Git checkpoint:
  47feaa0 recovery: PsyNova fresh candidate local and tunnel pass 20260612_215901

## Phase rule

Build .dev from canonical candidate only.

Do not:
- quarantine old paths yet
- promote /srv/shared/PsyNova
- use qpc.shaneturon.ca
- patch old launcher paths yet
- deploy live

## Exit condition

.dev passes when:
- frontend builds successfully
- backend builds or typechecks successfully
- .dev surface opens
- .dev visual matches the fresh local/tunnel candidate
- no QPC mutant surface appears
- API health remains valid or expected API routing is explicitly documented

NEXT_ACTION=Run .dev build audit.
DEPLOY_BLOCKED=UNTIL_DEV_PASS
