# PsyNova compliance-gateway interface upgrade

This change converts PsyNova into a reversible clinic interface layer for a Québec psychology clinic.

## Why

The clinic uses compliant third-party systems for telehealth, patient documents, patient records, billing, and custody of sensitive data. PsyNova should not become the system of record for clinical notes, EHR data, telehealth media, uploaded documents, or patient-data custody.

## What changed

- Adds a patient-facing gateway UI for booking, telehealth, forms, secure documents, billing, and help/contact.
- Replaces local appointment/demo clinical-data capture with outbound links to approved third-party systems.
- Adds backend vendor-link configuration endpoints that expose only non-secret public URLs.
- Adds legal/privacy/emergency disclaimers.
- Keeps the patch reversible by backing up touched files before replacement.

## Revert

Run (from the repository root):

```bash
bash scripts/revert_compliance_gateway_patch.sh .
```

## Important

This patch does not certify legal compliance. Final content, privacy notices, consent workflows, third-party agreements, and professional obligations must be reviewed by the clinic owner, legal counsel, and the licensed Québec psychologist responsible for practice governance.
