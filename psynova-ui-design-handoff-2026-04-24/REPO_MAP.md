# Repository map: expected folders → PsyNova actual paths

Use this if you are used to `src/components`, `src/pages`, Next.js `app/`, etc. This project is a **single-page app** with **string-template views** in one large module plus focused modules for booking, CMS, and API.

---

## 1. `src/` (frontend source)

**Actual location:** `frontend/src/`

| File | Role |
|------|------|
| `main.js` | Entry: i18n init, `styles.css`, loads `app.js` → `init()`. |
| `app.js` | Thin shell: `VITE_SPA_MODE` — **`legacy`** (default) = full maquette via `app-legacy.js`; **`gateway`** = compliance + patient portal in `compliance-gateway.js`. |
| `app-legacy.js` | **Main UI:** hash router, `render()`, `viewLanding()`, `viewLogin()`, `viewBook()` path, public wrap (header/nav/footer), `/app/*` logged-in views. **This is the closest thing to “pages + routes” combined.** |
| `booking-wizard.js` | Booking step UI, state, calendar widget HTML (used from legacy `/book`). |
| `api.js` | `fetch` helpers, auth header, appointments and related endpoints. |
| `i18n.js` | Translations, language sync, `t()` for UI strings. |
| `site-content.js` | Fictional **team** (`TEAM[]`) and **blog** (`BLOG_POSTS[]`) content — cartoon names, educational mock. |
| `service-categories.js` | Service categories for booking and services page. |
| `disclaimers.js` | Disclaimer text helpers / blocks. |
| `legal-content.js` | Legal copy. |
| `compliance-gateway.js` + `compliance-gateway.css` | Alternate shell when `VITE_SPA_MODE=gateway` (compliance + booking test flow). |
| `cms-*.js`, `translate-widget.js` | CMS admin hooks, optional translate widget. |
| `mockup-banner.js` | Dev / mockup banner if enabled. |

**There is no** `src/components/` **or** `src/pages/`. New “components” are either new functions in `app-legacy.js` or new `.js` modules imported there.

---

## 2. `components/` and `pages/`

**Not present as directories.** Reusable **patterns** (headers, cards) are HTML strings inside `app-legacy.js` and CSS in `styles.css` / `compliance-gateway.css`.

- **“Pages”** ≈ `function viewX()` return values, selected in `render()` by `state.route`.

---

## 3. `routes` / `router`

**Not a separate file.** Implemented in `app-legacy.js`:

- `routeFromHash()` reads `location.hash`.
- `render()` picks `view*` by route string `r`.

### Public routes (hash, leading `#` in browser)

| Route | View (conceptual “page”) |
|-------|---------------------------|
| `/`, `''` | Landing |
| `/about` | About |
| `/services` | Services |
| `/team` | Team listing (therapist cards from `site-content.js` **TEAM**) |
| `/blog` | Blog index |
| `/blog/{slug}` | Blog post |
| `/contact` | Contact |
| `/login` | Login |
| `/register` | Register |
| `/book` | Booking wizard |
| `/legal` | Legal |

### Authenticated `/app/*` (requires token + user; otherwise shows login)

| Route | View |
|-------|------|
| `/app`, `/app/` | Dashboard |
| `/app/appointments` | Appointments |
| `/app/messages` | Messages (mock) |
| `/app/admin` | Admin |
| `/app/cms` | CMS |
| `/app/telehealth` | Placeholder (“gray” module) |
| `/app/billing` | Placeholder |
| `/app/ehr` | Placeholder |
| `/app/clinician` | Placeholder |
| `/app/settings` | Settings |

**Note:** There is **no** `/team/{id}` **therapist detail route** in the current router — only a **list** on `/team`. **Blog** has `/blog/{slug}`. Adding provider detail pages would be a **new route + new view** (and likely nav links from team cards).

---

## 4. `api` (client)

**Actual file:** `frontend/src/api.js`

- Base URL, auth token (`getToken` / `setToken` pattern — see file).
- Appointments, auth, CMS-related calls as implemented.

---

## 5. `backend`

**Actual location:** `backend/` (NestJS)

| Area | Path |
|------|------|
| Bootstrap | `src/main.ts`, `src/app.module.ts` |
| **Auth** | `src/auth/` — `auth.controller.ts`, `auth.service.ts`, `dto/`, `guards/auth-token.guard.ts`, `dev-auth-bypass.ts` (dev) |
| **Appointments / booking** | `src/appointments/` — controller, service, DTOs, module |
| **CMS** | `src/cms/` — public + admin controllers, service, DTOs |
| **Forms** | `src/forms/` — contact, etc. |
| **Health** | `src/health/` |
| **Translation** | `src/translation/` |
| **DB** | `src/database/` |

`therapist` is not a top-level module name; roles like `therapist` may appear in auth. Team data for the public site is **static** in `frontend/src/site-content.js` unless you later add API-driven bios.

---

## 6. `therapist` / provider UX

- **Data:** `TEAM` in `site-content.js` (id, name, role, bio, illustration prompt).
- **UI:** `viewTeam()` in `app-legacy.js` renders the listing.
- **Gap for design brief:** per-provider **detail** pages are **not** implemented yet; designer’s suggestion to add them matches extending routes + a `viewTeamMember(id)` (or similar) and links from each card.

---

## 7. `booking`

| Layer | Where |
|-------|--------|
| UI steps / HTML | `frontend/src/booking-wizard.js` |
| Route `#/book` + integration | `frontend/src/app-legacy.js` (search for `/book`, `bookingWizard`, `onServiceCardOpenBooking`) |
| Appointments API | `backend/src/appointments/`, `frontend/src/api.js` |

---

## 8. `auth`

| Layer | Where |
|-------|--------|
| UI | `viewLogin`, `viewRegister` in `app-legacy.js` |
| API | `backend/src/auth/`, client in `api.js` |

---

## 9. Styling

- **Global / maquette:** `frontend/src/styles.css`
- **Gateway mode:** `frontend/src/compliance-gateway.css` (imported when gateway mode is on)
- **HTML shell:** `frontend/index.html` — root `#app`

---

## 10. Suggested file order for a visual pass (no logic change)

1. `frontend/src/styles.css` — spacing, type scale, components-as-classes.
2. `frontend/src/app-legacy.js` — `publicPageWrap`, nav, footer, `render()`-selected layouts (keep route strings and `bind()` behaviors).
3. `frontend/src/booking-wizard.js` — step indicators and card layout.
4. `frontend/src/compliance-gateway.js` — only if gateway shell is in scope.
5. `frontend/index.html` — meta, optional font links (already minimal).

For **backend** behavior or route additions, involve `backend/src` and the matching `api.js` methods.
