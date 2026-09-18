/* Push only: never cache authenticated pages, API responses, or tokens. */
const DEVICE_CACHE = 'nivaso-push-device-v1'
const DEVICE_URL = '/__push_device__'

self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()))
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PUSH_DEVICE') return
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(DEVICE_CACHE)
      await cache.put(DEVICE_URL, new Response(JSON.stringify({ id: event.data.id || null })))
      event.ports[0]?.postMessage({ ok: true })
    } catch { event.ports[0]?.postMessage({ ok: false }) }
  })())
})

function notificationPath(value) {
  // Notification destinations are always internal business-admin detail pages.
  return typeof value === 'string' && /^\/(support\/[A-Z0-9-]+|(?:orders|appointments)\/[a-f0-9-]{36})$/.test(value) ? value : '/dashboard'
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload
    try { payload = event.data?.json() } catch { return }
    const stored = await (await caches.open(DEVICE_CACHE)).match(DEVICE_URL)
    const device = stored ? await stored.json() : null
    if (!payload || !device?.id || payload.subscription_id !== device.id) return
    await self.registration.showNotification(payload.title || 'New business activity', {
      body: payload.body || 'Open your business portal to view it.',
      icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
      tag: payload.tag, renotify: false,
      data: { url: notificationPath(payload.url), id: payload.id },
    })
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) client.postMessage({ type: 'NOTIFICATIONS_UPDATED' })
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const target = new URL(notificationPath(event.notification.data?.url), self.location.origin).href
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const client = windows.find(window => new URL(window.url).origin === self.location.origin)
    if (client) { await client.navigate(target); await client.focus() }
    else await self.clients.openWindow(target)
  })())
})
