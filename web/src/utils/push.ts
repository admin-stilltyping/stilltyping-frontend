import { pushApi } from '@/api/push'

const storageKey = 'nivaso-push-device'
type Device = { id: string; slug: string }

export function pushSupport(): 'supported' | 'install' | 'unsupported' {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true)
  if (ios && !standalone) return 'install'
  return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window ? 'supported' : 'unsupported'
}

export function keyBytes(value: string): Uint8Array {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

function device(): Device | null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null')
    return value && typeof value.id === 'string' && typeof value.slug === 'string' ? value : null
  } catch { return null }
}

async function bindWorker(registration: ServiceWorkerRegistration, id: string | null) {
  const worker = registration.active
  if (!worker) throw new Error('Notifications are not ready. Please try again.')
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = window.setTimeout(() => { channel.port1.close(); reject(new Error('Notification setup timed out. Please try again.')) }, 5000)
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout)
      channel.port1.close()
      if (event.data?.ok) resolve()
      else reject(new Error('Unable to save notification settings on this device.'))
    }
    worker.postMessage({ type: 'PUSH_DEVICE', id }, [channel.port2])
  })
}

export async function pushEnabled(slug: string): Promise<boolean> {
  const saved = device()
  if (!saved || saved.slug !== slug || pushSupport() !== 'supported' || Notification.permission !== 'granted') return false
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (!registration || !await registration.pushManager.getSubscription()) return false
  return (await pushApi.status(slug, saved.id)).active
}

export async function enablePush(slug: string, key: string): Promise<void> {
  // Permission is requested only in the Enable button's click handler.
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notifications were not allowed. You can enable them in your browser’s site settings.')
  await navigator.serviceWorker.register('/push-sw.js', { scope: '/', updateViaCache: 'none' })
  const registration = await navigator.serviceWorker.ready
  const bytes = keyBytes(key)
  let subscription = await registration.pushManager.getSubscription()
  const previous = device()
  const oldKey = subscription?.options.applicationServerKey
  const sameKey = oldKey && new Uint8Array(oldKey).length === bytes.length && new Uint8Array(oldKey).every((value, i) => value === bytes[i])
  if (subscription && (!sameKey || (previous && previous.slug !== slug))) {
    await bindWorker(registration, null)
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes })
  try {
    const saved = await pushApi.subscribe(slug, subscription.toJSON())
    await bindWorker(registration, saved.id)
    localStorage.setItem(storageKey, JSON.stringify({ id: saved.id, slug }))
  } catch (error) {
    await subscription.unsubscribe().catch(() => false)
    localStorage.removeItem(storageKey)
    throw error
  }
}

export async function disablePush(slug: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (!registration) { localStorage.removeItem(storageKey); return }
  // Persist disabled state before revoking, to suppress already queued alerts.
  const cache = await caches.open('nivaso-push-device-v1')
  await cache.put('/__push_device__', new Response(JSON.stringify({ id: null })))
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    await subscription.unsubscribe()
    // The browser has revoked delivery even if the server is temporarily offline.
    await pushApi.unsubscribe(slug, subscription.endpoint).catch(() => undefined)
  }
  for (const notification of await registration.getNotifications()) notification.close()
  localStorage.removeItem(storageKey)
}
