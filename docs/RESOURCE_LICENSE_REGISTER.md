# Resource License Register

Last reviewed: 2026-04-25  
Scope: PsyNova demo/planning assets and integrations  
Rule used: no resource is marked open/commercial unless verified from an official source page or package `LICENSE` file.

## Status Legend

- `VERIFIED_OPEN` - license text verified from official license file/docs and appears usable in commercial contexts.
- `VERIFIED_COMMERCIAL` - official provider/legal/docs verified; commercial service with signup/API credential flow.
- `PLACEHOLDER_REQUIRES_SIGNUP` - integration requires account setup; credentials pending.
- `MOCK_ONLY_LICENSE_REQUIRED` - license not fully verified for deployment use in this pass.
- `DO_NOT_USE_UNVERIFIED` - no official license verification yet.

## Verified Sources Used (Official)

- Zoom Server-to-Server OAuth docs: <https://developers.zoom.us/docs/internal-apps/s2s-oauth/>
- Twilio API keys docs: <https://www.twilio.com/docs/iam/api-keys>
- Twilio Terms of Service: <https://www.twilio.com/legal/tos>
- Stripe API keys docs: <https://docs.stripe.com/keys>
- Stripe legal hub: <https://stripe.com/legal>
- SendGrid terms page: <https://sendgrid.com/policies/terms-of-service/>
- Postmark API overview (token auth): <https://postmarkapp.com/developer/api/overview>
- Postmark Terms of Service: <https://postmarkapp.com/terms-of-service>
- Amazon SES API docs: <https://docs.aws.amazon.com/ses/latest/dg/send-email-api.html>
- AWS service terms: <https://aws.amazon.com/service-terms/>
- Jitsi projects page: <https://jitsi.org/projects/>
- Jitsi Meet LICENSE (Apache-2.0): <https://raw.githubusercontent.com/jitsi/jitsi-meet/master/LICENSE>
- Heroicons LICENSE (MIT): <https://raw.githubusercontent.com/tailwindlabs/heroicons/master/LICENSE>
- Lucide LICENSE (ISC + inherited MIT notices): <https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE>
- Tabler Icons LICENSE (MIT): <https://raw.githubusercontent.com/tabler/tabler-icons/master/LICENSE>
- Pexels license page: <https://www.pexels.com/license/>

## Register

| Name | Category | Official URL | License Type | Commercial Use Allowed | Signup Required | API Key Required | Status | Notes |
|---|---|---|---|---|---|---|---|---|
| Zoom | video providers | <https://developers.zoom.us/docs/internal-apps/s2s-oauth/> | Commercial SaaS terms | yes | yes | yes | VERIFIED_COMMERCIAL | credentials pending |
| Daily.co | video providers | <https://www.daily.co/> | Commercial SaaS (license verification pending) | unknown | yes | yes | PLACEHOLDER_REQUIRES_SIGNUP | credentials pending |
| Whereby | video providers | <https://whereby.com/> | Commercial SaaS (license verification pending) | unknown | yes | yes | PLACEHOLDER_REQUIRES_SIGNUP | credentials pending |
| Jitsi Meet | video providers | <https://raw.githubusercontent.com/jitsi/jitsi-meet/master/LICENSE> | Apache-2.0 | yes | no | no | VERIFIED_OPEN | Open-source/self-hostable path verified from LICENSE |
| Twilio Voice | VoIP providers | <https://www.twilio.com/docs/iam/api-keys> | Commercial SaaS terms | yes | yes | yes | VERIFIED_COMMERCIAL | credentials pending |
| Telnyx | VoIP providers | <https://telnyx.com/> | Commercial SaaS (license verification pending) | unknown | yes | yes | PLACEHOLDER_REQUIRES_SIGNUP | credentials pending |
| Vonage | VoIP providers | <https://www.vonage.com/> | Commercial SaaS (license verification pending) | unknown | yes | yes | PLACEHOLDER_REQUIRES_SIGNUP | credentials pending |
| SendGrid | email providers | <https://sendgrid.com/policies/terms-of-service/> | Commercial SaaS terms | yes | yes | yes | VERIFIED_COMMERCIAL | credentials pending |
| Postmark | email providers | <https://postmarkapp.com/developer/api/overview> | Commercial SaaS terms | yes | yes | yes | VERIFIED_COMMERCIAL | API token headers explicitly documented |
| Amazon SES | email providers | <https://docs.aws.amazon.com/ses/latest/dg/send-email-api.html> | Commercial cloud service terms | yes | yes | yes | VERIFIED_COMMERCIAL | credentials pending |
| Stripe | email providers (billing dependency) | <https://docs.stripe.com/keys> | Commercial SaaS terms | yes | yes | yes | VERIFIED_COMMERCIAL | included per requested safe defaults |
| Heroicons | icons | <https://raw.githubusercontent.com/tailwindlabs/heroicons/master/LICENSE> | MIT | yes | no | no | VERIFIED_OPEN | verified in package license file |
| Lucide | icons | <https://raw.githubusercontent.com/lucide-icons/lucide/main/LICENSE> | ISC (+ inherited MIT notices) | yes | no | no | VERIFIED_OPEN | verified in package license file |
| Tabler Icons | icons | <https://raw.githubusercontent.com/tabler/tabler-icons/master/LICENSE> | MIT | yes | no | no | VERIFIED_OPEN | verified in package license file |
| Unsplash | stock images | <https://unsplash.com/license> | Unsplash License (not fetched in this pass) | unknown | no | no | MOCK_ONLY_LICENSE_REQUIRED | license review required before production |
| Pexels | stock images | <https://www.pexels.com/license/> | Pexels License | yes | no | no | VERIFIED_OPEN | official page states free use incl. website/app contexts |
| Pixabay | stock images | <https://pixabay.com/service/license/> | Pixabay License (unverified this pass) | unknown | no | no | MOCK_ONLY_LICENSE_REQUIRED | official page timed out; manual review required |
| Wellness content bundles (generic) | wellness content | N/A | Unknown | unknown | unknown | unknown | DO_NOT_USE_UNVERIFIED | no official source verified |
| Mood tracking toolkits (generic) | mood tracking tools | N/A | Unknown | unknown | unknown | unknown | DO_NOT_USE_UNVERIFIED | no official source verified |
| Journaling templates (generic) | journaling tools | N/A | Unknown | unknown | unknown | unknown | DO_NOT_USE_UNVERIFIED | no official source verified |
| Mandalas/coloring packs (generic) | mandalas/coloring | N/A | Unknown | unknown | unknown | unknown | MOCK_ONLY_LICENSE_REQUIRED | artwork reuse rights not verified |
| Sudoku/puzzle packs (generic) | sudoku/puzzles | N/A | Unknown | unknown | unknown | unknown | MOCK_ONLY_LICENSE_REQUIRED | dataset/IP rights not verified |
| ADHD strategy libraries (generic) | ADHD strategies | N/A | Unknown | unknown | unknown | unknown | MOCK_ONLY_LICENSE_REQUIRED | clinical content rights not verified |
| Clinical worksheets/scales (generic) | clinical worksheets | N/A | Unknown | unknown | unknown | unknown | MOCK_ONLY_LICENSE_REQUIRED | defaulted per requirement unless explicitly confirmed open |
| Music/audio packs (generic) | music/audio | N/A | Unknown | unknown | unknown | unknown | MOCK_ONLY_LICENSE_REQUIRED | sync/performance rights not verified |
| Biometric integrations (generic) | biometric integrations | N/A | Platform terms vary | unknown | yes | yes | PLACEHOLDER_REQUIRES_SIGNUP | credentials pending |

## Placeholder Credentials (Tomorrow Setup)

Only placeholders should be committed:

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_ACCOUNT_ID`
- `ZOOM_WEBHOOK_SECRET`
- `DAILY_API_KEY`
- `WHEREBY_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `TELNYX_API_KEY`
- `VONAGE_API_KEY`

No production secrets should be committed.
