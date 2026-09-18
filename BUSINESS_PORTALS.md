# Business provisioning and subdomain access

Run the context-agent backend on port 8000, then start both Vite apps:

```bash
npm run dev:admin
# In another terminal:
npm run dev:web
```

1. Sign in to `http://localhost:5174/businesses` as a super-admin.
2. Choose **New Business**, enter a name and review the generated editable slug.
3. Enter a description, timezone and initial plan, then create the business.
4. Save the displayed business-admin username/password. The password is shown once.
5. Open the generated `http://<slug>.localhost:5173/login` link and sign in.
6. The portal opens the [demo dashboard](web/src/features/dashboard/README.md), with
   10 saved widgets selected from 16 types. Use **Business Profile** to view the
   saved business details, including the same permanent `_id`.

The super-admin list and detail screens show the ID and portal address. Status and
plan changes are persisted. Suspended/inactive businesses cannot log in; existing
sessions are revoked. Slugs cannot be renamed after creation in this milestone.

The portal resolves exactly one subdomain under `VITE_TENANT_BASE_DOMAIN` and
verifies the owner's JWT with `/auth/me` before rendering protected pages. It uses
the backend-returned business, never query-string overrides or a shared API-key
login shortcut. Unknown business subdomains show an unavailable message.
`localhost:5173/login` also supports manually entering a business slug.

Use `.env.example` for web configuration and `admin/.env.example` for super-admin
configuration. Production needs wildcard DNS/TLS, the portal build served at those
subdomains, and reverse-proxy routes for `/auth`, `/admin` and `/web`. Set
`VITE_WEB_URL=https://example.com` for admin and
`VITE_TENANT_BASE_DOMAIN=example.com` for web. Do not include secrets in VITE variables.

### Vercel production

Deploy this repository as two Vite projects, with root directories `web` and
`admin`, build command `npm run build`, and output directory `dist`. Include source
files outside each root directory so the shared workspace packages are available.

- Business portal domain: `*.stilltyping.in`. Set
  `VITE_TENANT_BASE_DOMAIN=stilltyping.in` and
  `VITE_ADMIN_URL=https://superadmin.stilltyping.in`.
- Super-admin domain: `superadmin.stilltyping.in`. Set
  `VITE_WEB_URL=https://stilltyping.in` so business links use the correct suffix.
- Keep `VITE_API_BASE_URL` unset or empty in both projects. Their `vercel.json`
  files proxy API requests to `https://stilltyping-backend.vercel.app` before the
  SPA fallback. This avoids cross-origin API requests. Rewrite caching is disabled
  so authenticated responses are not stored by the proxy.
- Deploy the separate landing-page repository at `stilltyping.in`.

Rebuild after changing any `VITE_` setting. If the backend URL changes, update both
Vercel configuration files and redeploy.

Backend code and migration are in `context-agent/src/super_admin/businesses` and
`migrations/versions/007_businesses.py`. If the initial password is lost, run in the
backend repository:

```bash
docker compose exec agent context-agent-super-admin reset-business-password --username <slug>
```

The command uses hidden password prompts and invalidates old sessions.

## Current scope

Business creation, list/detail views, owner login, saved profiles, and status/plan
metadata are connected. Feature entitlements, business profile editing, signup
approval and other existing unfinished screens are separate work. Legacy backend
`/api/v1` routes still need their own authentication and tenant authorization before
public exposure; the protected business profile does not secure those routes.

## Checks

```bash
node --test tests/*.test.mjs
npm run build:web
npm run build:admin
```

The frontend tests cover DNS validation, reserved names, host boundaries, portal
URLs, token expiry, and keeping failed sign-ins on the form. Responses from an old
session cannot sign out a newer session. Backend tests cover persistence, credentials, duplicate slugs, account lockout
and tenant/role isolation.
