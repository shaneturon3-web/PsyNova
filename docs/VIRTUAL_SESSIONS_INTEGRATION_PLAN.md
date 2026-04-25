# Virtual Sessions Integration Plan (Day 1)

This is an implementation plan only. No behavior changes are applied in this pass.

## 1) Current App Structure

### Frontend (`app/frontend/src`)
- SPA shell entry: `app.js` chooses `legacy` vs `gateway` mode.
- Core app flow currently lives in `app-legacy.js` with hash routes.
- Booking UI/state machine: `booking-wizard.js` (5-step flow).
- API client wrapper: `api.js` (`/api` proxied by Vite).
- Telehealth currently exists as a placeholder route (`#/app/telehealth`) with no provider integration.

### Backend (`app/backend/src`)
- NestJS modular API: `auth`, `appointments`, `forms`, `cms`, `translation`, `vendor-links`.
- Appointment contract today supports:
  - `patientId`, `clinicianId`, `startsAt`, `endsAt`, `status`
  - optional `serviceCategory`
  - optional session notes translation fields
- No dedicated realtime session module/provider adapter yet.

### Config and Runtime
- Frontend env exposes vendor URLs (`VITE_VENDOR_TELEHEALTH_URL`, etc.) as link placeholders.
- Backend env exposes matching vendor URLs (`VENDOR_TELEHEALTH_URL`, etc.) and returns readiness via `vendor-links`.
- No API keys for video/voice providers are currently defined in app env templates.

## 2) Where Video/Phone Sessions Should Connect

## Booking to Session Linkage Points
- Frontend booking step 4 already captures `sessionType` (`video`, `in_person`, `phone`) in `booking-wizard.js`.
- Backend appointment create DTO/service currently does not persist `sessionType`; this is the first required contract extension.
- Recommended integration seam:
  - Appointment creation/confirmation creates a provider session resource (or placeholder record).
  - Therapist/admin views fetch session join metadata from appointment/session endpoints.
  - Public/patient booking confirmation displays join instructions once session is provisioned.

## Therapist/Admin Areas
- Existing therapist/admin demo/workspace routes can host:
  - session status (scheduled/live/ended)
  - host controls (start/regenerate/join)
  - fallback escalation (switch video provider or phone fallback)
- Existing `#/app/telehealth` placeholder should become the provider-agnostic session console.

## 3) Current Missing Fields / Routes / Components

## Missing Data Fields (Appointment + Session Domain)
- `sessionType` persisted server-side (currently frontend-only for booking UI).
- `sessionProvider` (zoom/daily/whereby/jitsi/twilio/telnyx/vonage).
- `sessionJoinUrlPatient`, `sessionJoinUrlTherapist`.
- `sessionHostUrl` (if provider supports host link separation).
- `sessionExternalId` (provider meeting/room identifier).
- `sessionStatus` (`provisioning`, `ready`, `live`, `ended`, `failed`).
- `sessionFallbackChain` (ordered backups + reason codes).
- `phoneDialInNumber`, `phoneDialInPin` (for voice fallback paths).

## Missing Backend Routes
- `POST /sessions/provision` (or appointment-scoped variant).
- `POST /sessions/:id/start` / `POST /sessions/:id/end` (host controls where applicable).
- `POST /sessions/:id/fallback` (provider failover).
- `GET /appointments/:id/session` (join metadata for patient/therapist).
- Webhook endpoints per provider (optional phase 2, but planned day 1).

## Missing Frontend Components
- Session readiness card in booking confirmation and appointments list.
- Provider badge/status pill and fallback reason UI.
- Dedicated telehealth workspace replacing gray placeholder.
- Phone session instruction panel (dial-in + backup path).

## 4) Required Providers and Positioning

## Primary
- Zoom (primary provider for earliest MVP with healthcare-grade path options).

## Backups
- Daily.co (backup WebRTC provider).
- Whereby (backup hosted room provider).
- Twilio Voice (VoIP fallback for voice-first sessions).
- Telnyx or Vonage (PSTN backup options).

## Low-friction / Open Option
- Jitsi (embedded or redirect flow; open-source/self-hostable option).

## 5) License / API Key Requirements

All third-party providers below require account setup and credentials:

- Zoom
  - OAuth or Server-to-Server app credentials depending on API path.
  - Meeting creation scopes and account-level configuration.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Daily.co
  - Daily REST API key and domain/room configuration.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Whereby
  - Whereby Embedded/API credentials and room policy setup.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Twilio Voice
  - Account SID/Auth Token/API key + TwiML/app setup.
  - Phone-number provisioning for outbound/inbound paths.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Telnyx
  - API key + number provisioning + call-control app setup.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Vonage
  - API key/secret + Voice API application + number config.
  - Marker: `PLACEHOLDER_API_KEY_REQUIRED`

- Jitsi
  - Public `meet.jit.si` embed path can run without paid credentials.
  - Self-hosted Jitsi requires infrastructure/domain/TLS and operational setup.
  - Marker for managed/commercial addons: `PLACEHOLDER_API_KEY_REQUIRED`

## 6) Signup-Required Items Marker

The following integrations are signup-dependent and should remain placeholders until credentials are issued:
- Zoom: `PLACEHOLDER_API_KEY_REQUIRED`
- Daily.co: `PLACEHOLDER_API_KEY_REQUIRED`
- Whereby: `PLACEHOLDER_API_KEY_REQUIRED`
- Twilio Voice: `PLACEHOLDER_API_KEY_REQUIRED`
- Telnyx: `PLACEHOLDER_API_KEY_REQUIRED`
- Vonage: `PLACEHOLDER_API_KEY_REQUIRED`

## 7) Open-Source / Self-Hostable Options

- Jitsi:
  - Open-source and self-hostable.
  - Can be used via low-friction public room flow for demo fallback.
- Phone stack alternatives can be self-built with SIP infra, but this is not low-friction for day-1 MVP compared to managed providers.

## 8) Safest MVP Recommendation

## Proposed Day-1 MVP Path
1. Keep existing booking UX and appointment contracts stable for users.
2. Add backend session layer behind feature flags and placeholders.
3. Use Zoom as primary provisioning target with non-production placeholder credentials:
   - `PLACEHOLDER_API_KEY_REQUIRED`
4. Add Jitsi embedded or redirect fallback for immediate no-key demo continuity.
5. Add phone fallback path in session UI:
   - Preferred managed VoIP: Twilio Voice (`PLACEHOLDER_API_KEY_REQUIRED`)
   - Backup telephony: Telnyx or Vonage (`PLACEHOLDER_API_KEY_REQUIRED`)
6. Preserve provider-agnostic session abstraction to avoid lock-in.

## Why this is safest
- Lowest disruption to current booking and appointment flow.
- Fastest visible path to a working session experience (Jitsi fallback even before paid credentials).
- Operational resilience via explicit provider fallback chain.
- Clear separation between mock/demo behavior and production credentials.

## 9) No-Behavior-Change Scope (This Pass)

- This pass is audit + planning only.
- No frontend route behavior changed.
- No backend route behavior changed.
- No DTO/schema mutations applied yet.

## Build Verification (Audit Loop)

- Frontend build: `npm run build` in `app/frontend` -> success.
- Backend build: `npm run build` in `app/backend` -> success.
- No documentation import/path breakages required fixes.

## Suggested Next Implementation Sequence

1. Extend appointment/session data model with provider-neutral session fields.
2. Add backend session provisioning module with provider adapters.
3. Add telehealth workspace UI and appointment-level join cards.
4. Implement provider fallbacks and audit logging.
5. Add integration test fixtures for session provisioning and fallback routing.
