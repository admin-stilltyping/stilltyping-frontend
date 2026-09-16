# Public customer chat

`PublicChatPage` serves `/c/:slug` and the legacy `/chat/:slug` alias outside the authenticated portal layout. `api.ts` uses a separate fetch client without admin credentials or login redirects. Each business has its own server-issued visitor session.

The standalone and iframe views share the same conversation component. It supports multiline text, IME-safe Enter submission, plain-text replies, server history on reload, stable retry IDs, a new-chat action, loading/error/expiry states, and an explicit AI disclosure. No model picker is shown to visitors. The latest 100 server turns are loaded.

`WebChatSetup` is displayed in Integrations. It offers a shareable link and a script snippet. `web/public/chat-widget.js` is a dependency-free launcher with isolated shadow styles and a lazily loaded iframe. The website owner pastes the snippet before `</body>`.

## Visual direction

The chat uses the existing Nivaso blue (#2858dc), ink (#182538), muted text (#647185), white (#ffffff), a pale canvas (#edf2f8), and light dividers (#e4eaf1). System sans-serif keeps the widget small and consistent with the portal. A business initial/name anchors the header; left-aligned assistant replies and right-aligned visitor messages make turn ownership clear. The public interface gives the conversation most of the space, without portal navigation or model controls. CSS is scoped to `.public-chat`; the compact layout fills its iframe and mobile viewport.

## Local example

Open `http://nivaso-demo.localhost:5173/c/nivaso-demo`. To test embedding on a separate local site:

```html
<script src="http://localhost:5173/chat-widget.js" data-business="nivaso-demo" defer></script>
```

Use HTTPS URLs from the deployed portal on a real website. `/web/*` must reach the backend, `/c/*` must use the SPA fallback, and the chat page must allow framing by the host website. See backend `src/public_chat/README.md` for the visitor API, limits and deployment details.
