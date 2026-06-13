# Provider sandbox setup

> [MOCKUP PURPOSE ONLY - NOT REAL DATA]
>
> Every provider integration in this repo follows the same backend stub seam pattern:
> the endpoint returns a deterministic mock payload until the matching env keys are
> set, then the same endpoint flips to the live provider call. **All paid features
> are wired in code; flip them on by setting the matching env keys below. Until then,
> every endpoint returns deterministic mock data so the UI is 100% functional.**

This file walks you through obtaining trial / dev credentials for every provider
the backend can talk to, and where to paste each value. All keys go in
`app/backend/.env` (or `app/backend/.env.local`); never check real keys into git.

After editing `.env`, restart `npm run start:dev` for the new values to load.

---

## 1. Zoom — free Server-to-Server OAuth dev app

**Status:** `mintZoomLive()` is fully implemented. Mock fallback when keys are missing.

1. Sign in at <https://marketplace.zoom.us> with any free Zoom account.
2. **Develop -> Build App -> Server-to-Server OAuth**.
3. Name it `PsyNova dev` (or anything). Get an Account ID + Client ID + Client Secret.
4. Under **Scopes**, add the minimum:
   - `meeting:write:admin`
   - `meeting:read:admin`
   - `user:read:admin`
5. **Activate your app** (Server-to-Server OAuth apps don't need user OAuth flow).
6. Paste into `.env`:
   ```env
   ZOOM_ACCOUNT_ID=...
   ZOOM_CLIENT_ID=...
   ZOOM_CLIENT_SECRET=...
   ```
7. Verify:
   ```bash
   curl -sX POST http://localhost:3000/api/sessions/backup-video \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"smoke-1","provider":"zoom"}' | jq
   # mode should now be "live" and joinUrl should point at zoom.us/j/<real id>
   ```

---

## 2. Daily.co — free tier (STUB today)

**Status:** stub seam. `DAILY_API_KEY` is read for readiness reporting; live mint is
intentionally not wired yet (the integration call would be one POST to
`https://api.daily.co/v1/rooms`).

1. Sign up at <https://dashboard.daily.co/u/signup>.
2. **Developers -> API keys** -> copy the API key.
3. Paste:
   ```env
   DAILY_API_KEY=...
   ```
4. `GET /api/sessions/providers` will now show `backup.daily.configured=true`.
   `POST /api/sessions/backup-video {"sessionId":"...","provider":"daily"}` will
   log a warning and return a mock URL until `mintDailyLive()` is implemented.

---

## 3. Whereby — free trial (STUB today)

**Status:** stub seam. Same shape as Daily.co.

1. Sign up at <https://whereby.com/information/embedded/> (Embedded API trial).
2. **API keys** -> create a key.
3. Paste:
   ```env
   WHEREBY_API_KEY=...
   ```
4. Same caveat as Daily.co: live mint is wired but not yet implemented.

---

## 4. Jitsi — free, no signup

**Status:** real integration when enabled. Uses public `meet.jit.si` rooms.

```env
JITSI_PUBLIC_DEMO_ROOM=true
```

That's it. Verify:
```bash
curl -sX POST http://localhost:3000/api/sessions/backup-video \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"smoke-jitsi","provider":"jitsi"}' | jq
# joinUrl will be https://meet.jit.si/psynova-smoke-jitsi
```

---

## 5. Twilio — free trial (LIVE outbound to verified numbers)

**Status:** `mintTwilioLive()` is fully implemented and places a real outbound call
via the Twilio Voice REST API. The Twilio trial is free; outbound calls only work
to numbers you've verified in the Twilio console.

1. Sign up at <https://www.twilio.com/try-twilio>.
2. From the **Console** dashboard, grab:
   - Account SID
   - Auth Token
3. Buy a trial phone number (free with the trial). **Phone Numbers -> Manage -> Buy a number**.
4. **Phone Numbers -> Manage -> Verified Caller IDs** -> verify the destination number you
   want to call (this is a Twilio trial limitation; no verification needed once you upgrade).
5. Paste:
   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   # Optional — what the callee hears. Defaults to a Twilio demo TwiML URL.
   # TWILIO_TWIML_URL=https://your-domain/twiml/conference.xml
   ```
6. Verify (this places a REAL call to `+15145550101` — change to a verified number):
   ```bash
   curl -sX POST http://localhost:3000/api/sessions/phone-fallback \
     -H "Content-Type: application/json" \
     -d '{"sessionId":"smoke-tw","provider":"twilio","toNumber":"+15145550101"}' | jq
   # mode should now be "live" and notice should include the call SID.
   ```

---

## 6. Telnyx / Vonage — paid, wired stubs

**Status:** wired but not implemented. Setting `TELNYX_API_KEY` or `VONAGE_API_KEY`
+ `VONAGE_API_SECRET` flips the readiness flag and triggers `mintTelnyxLive()` /
`mintVonageLive()`, which currently log a warning and fall back to mock. Real
integration would mirror the Twilio pattern.

```env
TELNYX_API_KEY=
VONAGE_API_KEY=
VONAGE_API_SECRET=
```

---

## 7. Backup phone number (mock fallback)

When zero phone provider keys are configured, `/api/sessions/phone-fallback` returns
`BACKUP_PHONE_NUMBER` plus a deterministic 6-digit conference code derived from the
session id. Set this to a real demo conference number to make the mock visually
plausible:

```env
BACKUP_PHONE_NUMBER=+15145550100
```

---

## 8. Stripe — free test mode (LIVE Checkout against test cards)

**Status:** `BillingService` lazy-loads the `stripe` SDK. When `STRIPE_SECRET_KEY` is
set, `POST /api/billing/invoices/:id/checkout-session` returns a real Checkout URL
that accepts test cards. Without keys, it returns a mock URL that points at the
in-app simulator page (`POST /api/sim/billing/stripe-webhook`). Either way the
end-to-end paid invoice flow works.

1. Sign up at <https://dashboard.stripe.com/register>.
2. Stay in **Test mode** (top right toggle). All cards `4242 4242 4242 4242` /
   any future expiry / any 3-digit CVC will succeed.
3. **Developers -> API keys** -> copy:
   - Publishable key (`pk_test_...`) — you only need this if you wire Stripe.js.
   - Secret key (`sk_test_...`).
4. Paste:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
5. (Optional but recommended) **Webhook signing secret** for local development:
   ```bash
   # one-time:
   curl -fsSL https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz \
     | tar xz -C ~/.local/bin/
   stripe login
   # leave running:
   stripe listen --forward-to localhost:3000/api/billing/stripe/webhook
   # copy the printed `whsec_...` into:
   ```
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Verify the live mint (you'll need a JWT — grab one from `/api/auth/login` first):
   ```bash
   TOKEN=$(curl -sX POST http://localhost:3000/api/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"clinician.demo@psynova.local","password":"Clinician!2026"}' \
     | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
   # Create an invoice
   INVOICE=$(curl -sX POST http://localhost:3000/api/billing/invoices \
     -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"patientId":"cccccccc-cccc-4ccc-8ccc-ccccccccccc1","clinicianId":"00000000-0000-4000-8000-000000000001","items":[{"description":"50-min session","quantity":1,"unitPriceCents":15000}]}')
   echo "$INVOICE" | jq
   INVOICE_ID=$(echo "$INVOICE" | python3 -c 'import sys,json;print(json.load(sys.stdin)["invoice"]["id"])')
   # Mint Checkout
   curl -sX POST "http://localhost:3000/api/billing/invoices/$INVOICE_ID/checkout-session" \
     -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
     -d '{"customerEmail":"buyer.demo@psynova.local"}' | jq
   # mode should be "live" with a stripe.com checkout URL.
   ```

If `STRIPE_SECRET_KEY` is unset the same call returns
`{"mode":"mock", "url":"/#/app/billing/sim-pay/<id>", "notice": "..."}` and the
SPA can flip the invoice to paid via the simulator endpoint — see SIMULATOR_GUIDE.md.

---

## 9. Audit-log signing + attachments storage

`POST /api/clinical/notes/:id/sign` HMACs the canonical note body, and the audit
chain mixes that secret into every `current_hash`. Set a strong value in any
shared environment:

```env
AUDIT_LOG_HMAC_SECRET=<32+ random bytes>
ATTACHMENTS_DIR=app/uploads/clinical
```

`ATTACHMENTS_DIR` is auto-created on first upload. The folder is gitignored.

---

## 10. Internal test accounts

The deterministic test logins for the dev `#/app/test-accounts` page are seeded by:

```bash
cd app/backend
npm run db:migrate:local   # idempotent
npm run db:seed:test       # creates patient.demo / clinician.demo / admin.demo
```

| Account                       | Password         | Role      |
| ----------------------------- | ---------------- | --------- |
| patient.demo@psynova.local    | `Patient!2026`   | patient   |
| clinician.demo@psynova.local  | `Clinician!2026` | clinician |
| admin.demo@psynova.local      | `Admin!2026`     | admin     |

Visit `http://localhost:5173/#/app/test-accounts` (link auto-appears in the sidebar
when `NODE_ENV !== 'production'` and the seed has run) for one-click sign-in.

---

## Verification checklist

After setting any subset of the keys above:

```bash
# Provider readiness summary (should reflect what you configured)
curl -s http://localhost:3000/api/sessions/providers | jq

# Backup video, auto-pick (zoom -> daily -> whereby -> jitsi)
curl -sX POST http://localhost:3000/api/sessions/backup-video \
  -H "Content-Type: application/json" -d '{"sessionId":"smoke-auto"}' | jq

# Phone fallback, auto-pick (twilio -> telnyx -> vonage)
curl -sX POST http://localhost:3000/api/sessions/phone-fallback \
  -H "Content-Type: application/json" -d '{"sessionId":"smoke-auto"}' | jq

# Telehealth launch (composes video + chat-mock + notes + checklist)
curl -s http://localhost:3000/api/telehealth/sessions/smoke-1/launch | jq
```
