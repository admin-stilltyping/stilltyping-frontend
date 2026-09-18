import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

const source = readFileSync(new URL('../web/public/push-sw.js', import.meta.url), 'utf8')

function worker(deviceId = 'this-device') {
  const handlers = {}, shown = [], navigated = [], messages = []
  let binding = deviceId
  const context = vm.createContext({
    URL, Response,
    caches: { open: async () => ({
      match: async () => new Response(JSON.stringify({ id: binding })),
      put: async (_, response) => { binding = (await response.json()).id },
    }) },
    self: {
      location: { origin: 'https://dental.stilltyping.in' },
      addEventListener: (type, handler) => { handlers[type] = handler },
      registration: { showNotification: async (title, options) => shown.push({ title, ...options }) },
      clients: {
        matchAll: async () => [{ url: 'https://dental.stilltyping.in/dashboard', navigate: async url => navigated.push(url), focus: async () => {}, postMessage: message => messages.push(message) }],
        openWindow: async url => navigated.push(url),
      },
    },
  })
  vm.runInContext(source, context)
  return {
    shown, navigated, messages,
    dispatch: async (type, data) => {
      let pending
      handlers[type]({ ...data, waitUntil: promise => { pending = promise } })
      await pending
    },
  }
}

const payload = { id: 'event', subscription_id: 'this-device', title: 'New order', body: 'A new order has been placed.', tag: 'event', url: '/orders/12345678-1234-1234-1234-123456789abc' }

test('push shows a notification for the bound device and refreshes the open portal', async () => {
  const w = worker()
  await w.dispatch('push', { data: { json: () => payload } })
  assert.equal(w.shown.length, 1)
  assert.equal(w.shown[0].title, 'New order')
  assert.equal(w.shown[0].tag, 'event')
  assert.equal(w.shown[0].renotify, false)
  assert.equal(w.messages[0].type, 'NOTIFICATIONS_UPDATED')
})

test('disabled, another-account and malformed pushes never show private account alerts', async () => {
  for (const id of [null, 'previous-account']) {
    const w = worker(id)
    await w.dispatch('push', { data: { json: () => payload } })
    assert.equal(w.shown.length, 0)
  }
  const w = worker()
  await w.dispatch('push', { data: { json: () => { throw new Error('Invalid JSON') } } })
  assert.equal(w.shown.length, 0)
})

test('turning notifications off suppresses a queued notification', async () => {
  const w = worker()
  const replies = []
  await w.dispatch('message', { data: { type: 'PUSH_DEVICE', id: null }, ports: [{ postMessage: message => replies.push(message) }] })
  assert.equal(replies[0].ok, true)
  await w.dispatch('push', { data: { json: () => payload } })
  assert.equal(w.shown.length, 0)
})

test('notification clicks cannot navigate to another tenant, external site or script URL', async () => {
  for (const url of ['https://other.stilltyping.in/orders/1', '//attacker.test', 'javascript:alert(1)', '/orders/../../login', '/support/%2f%2fattacker.test']) {
    const w = worker()
    await w.dispatch('notificationclick', { notification: { close() {}, data: { url } } })
    assert.equal(w.navigated[0], 'https://dental.stilltyping.in/dashboard')
  }
  const w = worker()
  await w.dispatch('notificationclick', { notification: { close() {}, data: { url: '/support/TKT-123ABC' } } })
  assert.equal(w.navigated[0], 'https://dental.stilltyping.in/support/TKT-123ABC')
})
