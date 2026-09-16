# Business dashboard

`DashboardPage.tsx` is lazily mounted at `/dashboard` and is the landing page after
business-admin login. The verified business session provides the query-cache key;
the backend derives authorization from its bearer token.

- `api.ts`: GET `/admin/dashboard`, POST `/admin/dashboard/generate`, PATCH
  `/admin/dashboard/config`; all support `days=7|30|90`.
- `types.ts`: API response and shared widget data contracts.
- `WidgetRenderer.tsx`: widget frame and accessible chart data table.
- `widgets/`: 16 visual types using the existing Recharts dependency and HTML/SVG.

The server returns the catalog, four use cases, 10 selected widgets, synthetic
values, and a configuration revision. The selection and demo seed are persisted
by the backend package `context-agent/src/dashboard/` using migration `008`.
API failures display a retryable error; this page never silently replaces failed
requests with mock data. Every displayed metric is explicitly labelled demo.

Regenerate saves a new set of 10. Customization saves exactly 10 unique widget
types, preserving values for retained widgets. Requests include the loaded
revision; HTTP 409 prompts the user to reload if another tab changed the dashboard.
Sample period is a view filter, reset to 30 days when the page is reopened.

To extend the catalog, add the type and use-case metadata in the backend catalog,
its demo data contract/generator, the TypeScript type, and a renderer here. Replace
the demo data provider with authenticated real metrics only once their sources
and definitions are agreed.

## Validation

From the frontend root:

```bash
npm run build -w web
node --test tests/business-auth.test.mjs tests/business-routing.test.mjs
cd web
../node_modules/.bin/eslint src/features/dashboard src/components/layout/Header.tsx src/components/layout/Layout.tsx src/App.tsx
```

Browser checks: sign in via a business subdomain; check 10 widgets, change use case
and generate, change period, replace widgets in Customize, and refresh to verify
persistence. Check desktop and mobile layouts, the mobile navigation dialog, and
chart data tables. Backend tests cover all 16 data types and business isolation.
