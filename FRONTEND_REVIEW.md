# Nivaso frontend review and recommended next step

Reviewed: 15 September 2026.

Frontend: `/Users/muthuraman/Desktop/nivaso-frontend`.
Backend comparison: `/Users/muthuraman/Desktop/context-agent`.

## Assessment

The frontend implements a broad business-management interface, while the supplied backend implements a smaller knowledge-and-support assistant. The migration between these two contracts is incomplete. **The next development milestone should be one working flow: tenant instructions → knowledge → chat → support ticket → resolution.**

The existing component structure, API modules, query hooks, and shared controls are reusable. The main work is contract alignment, tenant-safe state, and error handling. Adding more screens now would increase the integration backlog.

This review covered both applications (`web` and the platform `admin`), shared UI/types, route and API inventories, authentication, tenant selection, query/mutation handling, key feature flows, build/lint configuration, and deployment configuration. It combines source review with a browser check of the business portal and an isolated test of the actual instructions editor. It is not an exhaustive browser test of every screen or a dependency vulnerability audit.

Existing uncommitted frontend changes, including the support and instructions adaptations, were reviewed as part of the current working tree and preserved. Application code was not changed; this report is the only review addition to this repository.

## 1. Features and integration status

| Area | Frontend behavior | Compatibility with supplied backend |
|---|---|---|
| Business portal | Navigation, tenant selection, dashboard widgets, settings | Business directory, profile, metrics, and widget APIs are absent |
| Authentication | Business login, signup, pending approval; separate super-admin login | All `/auth/*` endpoints are absent |
| Tenant instructions | Read/edit/save the assistant's instructions | GET/PUT paths and payloads are adapted; state and error handling need fixes |
| Support tickets | Filter open/resolved tickets, view details, update status/notes | List/detail/update contracts are adapted; notes semantics and error handling need fixes |
| Agent test chat | Session list, history, model selection, tool/latency display | Uses an incompatible chat endpoint and response shape; history/model APIs are absent |
| Public customer chat | Tenant URL, persistent visitor ID, messages/history | Uses the old chat/history APIs; needs the same adapter as internal chat |
| Knowledge | Article list/detail/create/edit/archive, status and metadata | Backend has one document per tenant plus extracted knowledge units; article CRUD is a different model |
| Commerce and CRM | Products, services, offers, coupons, orders, customers, appointments, custom fields | Matching APIs and executable agent tools are absent |
| Channel integrations | Telegram, WhatsApp, Razorpay configuration | Backend has Telegram/WhatsApp/Instagram webhook receivers and CLI registration; configuration APIs are absent; Razorpay is absent |
| Operations | AI usage, agent runs, webhook events, notifications | Matching reporting APIs are absent; backend only returns usage/timing with individual requests |
| Plans and modules | Entitlements, model restrictions, module requests | Backend has no plans or entitlements; current UI exposes all modules |
| Platform admin | Business onboarding/approval, plans/overrides, requests, audit log, playbook, chat, usage | The entire `/super-admin/*` API surface is absent |

An AST inventory found **101 Axios request call sites: 75 in web and 26 in admin**. Only **five** match a method/path in the supplied backend: three support operations and two instructions operations. The remaining **96** target absent routes. These are call sites, not 101 unique endpoints or a percentage of completed features; the inventory includes modules that may not be routed. Public chat adds two separate raw-fetch call sites, both using the old contract.

The backend route definitions are in [api.py](/Users/muthuraman/Desktop/context-agent/src/context_agent/api.py:151). This comparison applies to the supplied checkout; another service or reverse proxy could implement additional routes, but none is defined here.

## 2. Prioritized findings

### P1 — Chat and knowledge cannot be connected by changing the base URL alone

[chat.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/api/chat.ts:5) sends to `/web/chat`. [ChatTest.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/chat/ChatTest.tsx:191) supplies `user_id`, `business_slug`, provider/model, and `admin_mode`; it reads `reply` and `tools_used`. [CustomerChat.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/chat/CustomerChat.tsx:50) duplicates the old request contract.

The backend accepts `POST /api/v1/tenants/{tenant_id}/agent/messages` with `request_id`, `message`, optional `channel`, and optional `external_user_id`; it returns `answer`, `outcome`, `tool_results`, knowledge context, timing, and usage. Its strict schema rejects the extra old fields. Updating only the URL would still fail validation, and updating only the request would leave response rendering broken.

[knowledge.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/api/knowledge.ts:9) expects article CRUD under `/admin/{slug}/knowledge`. The backend accepts document replacement, knowledge addition, and natural-language updates. It does not expose article status, keyword/source fields, or document/unit read-back endpoints.

**Action:** define shared frontend types from the current backend schemas and adapt both chat surfaces through one client. Reshape knowledge around the document/unit model, with a small backend read API for reload-safe management. Hide unsupported controls until their contracts exist.

### P1 — A configured internal key is embedded in the production web bundle

[client.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/api/client.ts:15) reads `VITE_INTERNAL_API_KEY` and sends it as `X-Internal-Key`. [RequireAuth.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/components/auth/RequireAuth.tsx:12) allows access without a token whenever that variable is populated. The check is not restricted to development builds.

I verified, without printing the secret, that the currently configured internal key is present literally in the generated production web JavaScript. The admin app has an analogous `VITE_SUPER_ADMIN_KEY` bypass in [RequireSuperAdmin.tsx](/Users/muthuraman/Desktop/nivaso-frontend/admin/src/components/RequireSuperAdmin.tsx:12); that key was not configured in the admin build checked.

**Impact:** anyone receiving a build containing a shared key can recover it, and the UI's login requirement can be bypassed by build configuration. The supplied backend also lacks authentication, so this frontend check does not establish server-side tenant protection.

**Action:** keep shared secrets on the server, remove production-capable key bypasses, and establish server-validated identity/tenant permissions before public access. Rotate an exposed key if a build containing it has been distributed; distribution or exploitation was not verified here.

### P1 — Switching tenants can save one tenant's instructions into another

[InstructionsPage.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/settings/InstructionsPage.tsx:12) keeps `text` and `dirty` across tenant changes. Its synchronization effect refuses to load new instructions while dirty. Meanwhile, [useInstructions.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/hooks/useInstructions.ts:12) binds the save mutation to the current tenant.

Reproduced using the actual editor component with isolated in-memory hooks:

1. Load tenant A's stored instructions.
2. Enter “Draft rules for tenant A.”
3. Switch to tenant B.
4. The editor still displays A's draft.
5. Save captures a write to tenant B containing A's draft.

No backend writes were made. This proves the component's behavior when tenant context changes without unmounting; the production business picker also depends on a currently absent business-list API.

**Action:** key the editor by tenant, explicitly handle unsaved changes, and bind draft/save completion to the originating tenant. Add a regression test that switches tenants with a dirty editor. Also preserve edits made while a save is pending; the current success callback unconditionally clears `dirty`.

### P2 — Both login screens violate React's hook ordering rule

[LoginPage.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/auth/LoginPage.tsx:21) and [SuperAdminLoginPage.tsx](/Users/muthuraman/Desktop/nivaso-frontend/admin/src/pages/SuperAdminLoginPage.tsx:18) return early for authenticated users before five `useState` calls. If authentication changes while the component remains mounted, the number of hooks changes.

Both lint runs confirm these errors. A production login crash was not exercised against a live authentication service.

**Action:** put all hooks before conditional returns, or separate the redirect wrapper from the login form. Test the signed-out → signed-in transition and expired-token handling.

### P2 — Failed requests often appear as empty data or have no visible recovery

[chat.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/api/chat.ts:8) turns all history/session failures into successful empty arrays. [ChatTest.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/chat/ChatTest.tsx:167) optimistically adds a message and clears input without an `onError` path. Instructions reads/saves do not render errors. [TicketDetail.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/support/TicketDetail.tsx:26) displays “Ticket not found” for missing data even when the request failed.

In the running business portal, the dashboard displayed failed widgets and Knowledge displayed an empty table without explaining its API failure. The active dashboard does have widget error states; the error-handling gap is not universal.

**Action:** distinguish loading, empty, unavailable, unauthorized, and not-found states. Keep failed messages retryable, preserve form drafts, render backend validation errors, and provide retry controls. Apply the backend's 20,000-character instructions limit in the editor.

### P2 — Chat state is not isolated from session changes and late responses

[ChatTest.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/chat/ChatTest.tsx:167) appends every successful response to the current message array. Session switching remains enabled while requests are pending. A response for session A can therefore be appended after the UI switches to session B. The history effect replaces the entire local array when query history changes, which can erase optimistic messages during a refetch.

[CustomerChat.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/chat/CustomerChat.tsx:98) only copies nonempty history and does not clear local messages when the URL tenant changes. An empty destination history can leave the previous tenant's conversation visible.

**Action:** store messages by tenant/session, capture that identity in each mutation, and merge responses into the originating conversation. Reconcile persisted and pending messages using stable IDs instead of replacing the whole array.

### P2 — “Add a note” replaces existing support notes

[TicketDetail.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/support/TicketDetail.tsx:116) presents a blank field with “Add a note for staff…”. Saving sends only the new text. The backend's [update_ticket](/Users/muthuraman/Desktop/context-agent/src/context_agent/support.py:79) replaces the existing notes string.

**Impact:** a staff member intending to append a note can erase earlier notes.

**Action:** either prefill an explicitly labeled edit field with existing notes, or implement a server-side append/history operation. Reset ticket drafts when tenant/reference changes as well.

### P2 — Entitlements expose unsupported modules and have competing data sources

[entitlements.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/api/entitlements.ts:5) now always returns `null`; [entitlementStore.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/store/entitlementStore.ts:18) treats loaded `null` as permission for every feature. This explains why the sidebar exposes modules with no matching backend.

[RequestModulesPage.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/modules/RequestModulesPage.tsx:165) uses the same `['entitlements', slug]` query key with a different API function that still calls the old endpoint. Navigation can therefore change which incompatible function populates the shared cache.

**Action:** use one capability source and show only supported modules for this backend. Plans/entitlements need a real backend contract before restoration. Frontend visibility is not server authorization.

### P2 — Deployment configuration does not establish API routing

Both Vercel configurations only rewrite to `index.html`: [web config](/Users/muthuraman/Desktop/nivaso-frontend/web/vercel.json:1), [admin config](/Users/muthuraman/Desktop/nivaso-frontend/admin/vercel.json:1). API clients default to a relative base URL. Development Vite proxies do not become production proxies. With these defaults, API requests can reach the SPA fallback instead of the API. The supplied backend also has no configured CORS middleware for a separate-origin deployment.

**Action:** document and test one deployment topology: a same-origin reverse proxy, or an explicit API origin with appropriate server CORS and authentication. Set cross-app URLs explicitly; login pages otherwise link to localhost ports.

## 3. Secondary issues

| Finding | Evidence and recommended change |
|---|---|
| Inconsistent tenant selection | [BusinessDetail.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/businesses/BusinessDetail.tsx:109) uses the URL slug directly. [useTenantSlug.ts](/Users/muthuraman/Desktop/nivaso-frontend/web/src/hooks/useTenantSlug.ts:13) reads a persisted store field, despite its comment claiming an uneditable JWT claim. Centralize selection and enforce membership on the server. This is not proof of an authorization bypass in an unknown older backend. |
| Broken unlocked settings navigation | [Sidebar.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/components/layout/Sidebar.tsx:34) can link to `/businesses`, but web only routes `/businesses/:slug`. The wildcard redirects away. |
| Incorrect Telegram setup URL | [IntegrationsPage.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/integrations/IntegrationsPage.tsx:138) shows `/webhooks/telegram/{slug}`; this backend uses `/webhooks/telegram` and resolves its configured secret/account. Align setup with the CLI/backend contract. |
| Filtering only the current appointments page | [AppointmentList.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/appointments/AppointmentList.tsx:51) fetches 20 records before applying status locally at line 72. Matching records on other pages disappear from the filtered view. Move filtering into the query and reset pagination. |
| Clearing optional values can send no change | [CouponDetail.tsx](/Users/muthuraman/Desktop/nivaso-frontend/web/src/pages/coupons/CouponDetail.tsx:108) assigns `undefined` for cleared caps/minimums; JSON omits these keys. Define an explicit nullable PATCH contract before restoring this module. |
| Shared modal accessibility | [Modal.tsx](/Users/muthuraman/Desktop/nivaso-frontend/packages/ui/src/Modal.tsx:14) lacks dialog semantics, an accessible close-button name, focus containment/restoration, Escape handling, and a height/scroll constraint. Fix the shared primitive once for every consumer. |
| Form labeling and mobile layout | Shared inputs rely on optional IDs for label association. The portal sidebar and chat session pane use fixed desktop widths with no mobile navigation mode. Verify keyboard navigation and narrow-screen overflow when the core flow is integrated. |
| Large initial bundle | Web eagerly imports route screens and produces a 582.15 kB minified JS chunk (162.09 kB gzip). Introduce route-level lazy loading after functional correctness. |
| Obsolete parallel implementations | Unrouted `TenantDashboard` and analytics mock fallback coexist with the active widget dashboard. Consolidate or clearly isolate demo code. The observed active dashboard did not substitute mock values for its failed widgets. |

## 4. Verification and limits

| Check | Result |
|---|---|
| `npm run build:web` | Passed TypeScript/build; Vite warns about a chunk over 500 kB |
| `npm run build:admin` | Passed TypeScript/build |
| Web lint | Failed: 15 errors, 2 warnings |
| Admin lint | Failed: 17 errors |
| Existing automated frontend tests | No test/spec files or test scripts found in the source/workspaces inspected |
| API method/path comparison | 5 of 101 Axios call sites align with supplied backend routes |
| Production bundle key check | Configured internal key found in web bundle; value never printed |
| Business portal browser check | Dashboard widget failures and unexplained empty Knowledge table observed |
| Isolated instructions test | Confirmed a tenant A draft can be submitted under tenant B |

The browser check used the already-running local Vite portal. Port 8000 is served through an SSH listener, so its remote deployment was not assumed to be identical to the supplied checkout. No live customer messages, database writes, credential changes, or destructive operations were performed. The admin application was reviewed and built but not tested against a working platform-admin backend.

Passing builds establish compilation, not end-to-end functionality. There is currently no passing frontend regression suite to establish user-flow correctness.

## 5. Recommended next development milestone

### Deliver a complete assistant workflow

Keep the first integrated product focused on **Instructions, Knowledge, Agent Chat, and Support Tickets**, with explicit tenant context. Preserve the other source modules for later work while removing their active navigation for this backend.

1. **Stabilize the foundation.** Fix both login hook violations and tenant-bound drafts. Remove browser shared secrets from deployable builds. Establish authenticated tenant access before any public pilot. Make lint pass and define production API routing.
2. **Connect chat.** Use one typed client for internal/public chat, generate a UUID `request_id`, carry a stable `external_user_id`, and render `answer`, escalation outcome, ticket/tool details, usage, and timing. Remove unsupported model/admin-mode fields. Treat timeout retries as potentially already processed; the backend's ticket deduplication does not make the entire chat operation idempotent.
3. **Connect knowledge management.** Submit `{title, summary}` to document PUT, `{content}` to knowledge POST, and `{change}` to knowledge PATCH. Display clarification/not-found/unchanged outcomes. Add a tenant-scoped document/unit read endpoint for reloading stored knowledge. Make full document replacement explicit in the UI.
4. **Finish instructions and tickets.** Add loading/error/retry/validation states, safe tenant switching, and clear note-editing semantics. Confirm ticket resolution survives reload. Add conversation-history APIs only if persisted session browsing is part of this milestone; otherwise remove the unsupported history/session controls.
5. **Add targeted regression coverage and CI.** Cover the exact chat contract, tenant switching during edits and pending messages, failed requests preserving drafts, knowledge read-back, and ticket resolution. Run both builds, both linters, and these tests in CI.

### Acceptance criteria

- For a selected tenant, an operator saves instructions and reloads the same value.
- The operator adds business knowledge, reloads it, and applies an update.
- A customer asks a covered question and sees the backend's answer.
- An unanswered question creates a support ticket whose reference can be opened in the portal.
- Staff can update notes without accidental loss, resolve the ticket, and see the state after reload.
- Switching tenants never displays or submits another tenant's draft or pending reply.
- A backend failure produces a visible, retryable state instead of a misleading empty screen.
- Public access requires server-enforced tenant permissions and a build with no shared internal/admin key.

### After the web flow works

Resolve the backend's channel routing, deduplication, and retry/durability defects before piloting Telegram/WhatsApp/Instagram. These issues and their isolated probes are documented in [CODEBASE_REVIEW.md](/Users/muthuraman/Desktop/context-agent/CODEBASE_REVIEW.md).

Commerce, booking, payments, subscriptions, and the super-admin console are later product milestones that require substantial backend APIs and agent tools. Their existing screens are a head start on UI work, not evidence those features are implemented end to end.
