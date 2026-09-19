import { readFileSync } from 'node:fs'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'

// Exercise real browser query observers and timers, not server-render defaults.
globalThis.window = new EventTarget()
const { QueryObserver, focusManager, onlineManager } = await import('@tanstack/react-query')
const source = readFileSync(new URL('../web/src/queryClient.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace('@tanstack/react-query', import.meta.resolve('@tanstack/react-query'))
const { createPortalQueryClient } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
)

function setup(t) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout', 'setInterval'], now: 1_800_000_000_000 })
  focusManager.setFocused(true)
  onlineManager.setOnline(true)
  const client = createPortalQueryClient()
  const observers = []
  client.mount()
  t.after(() => {
    for (const observer of observers) observer.destroy()
    client.unmount()
    client.clear()
    focusManager.setFocused(undefined)
  })
  const observe = (queryKey, queryFn) => {
    const observer = new QueryObserver(client, { queryKey, queryFn })
    observer.subscribe(() => {})
    observers.push(observer)
    return observer
  }
  return { client, observe }
}

for (const key of ['business-session', 'entitlements']) {
  test(`${key}: reuse data across navigation and short tab/network returns without minute polling`, async (t) => {
    const { observe } = setup(t)
    const queryKey = [key, 'business-a']
    let calls = 0
    const fetchData = async () => ({ version: ++calls })
    const first = observe(queryKey, fetchData)
    const second = observe(queryKey, fetchData)
    await setImmediate()
    assert.equal(calls, 1, 'simultaneous consumers share one request')
    assert.equal(second.getCurrentResult().data.version, 1)

    t.mock.timers.tick(60_000)
    await setImmediate()
    assert.equal(calls, 1, 'no one-minute background request')
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    first.destroy()
    second.destroy()
    const remounted = observe(queryKey, fetchData)
    await setImmediate()
    assert.equal(calls, 1, 'fresh data survives a route remount and tab return')
    assert.equal(remounted.getCurrentResult().data.version, 1)

    t.mock.timers.tick(5 * 60_000)
    await setImmediate()
    assert.equal(calls, 1, 'staleness alone does not start polling')
    focusManager.setFocused(false)
    focusManager.setFocused(true)
    await setImmediate()
    assert.equal(calls, 2, 'a stale tab return revalidates')
    assert.equal(remounted.getCurrentResult().data.version, 2)

    t.mock.timers.tick(5 * 60_000)
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    await setImmediate()
    assert.equal(calls, 3, 'a stale reconnect also revalidates')
  })

  test(`${key}: explicit invalidation and a different login/business bypass the cache`, async (t) => {
    const { client, observe } = setup(t)
    const queryKey = [key, 'business-a']
    let calls = 0
    const fetchData = async () => ({ version: ++calls })
    observe(queryKey, fetchData)
    await setImmediate()
    await client.invalidateQueries({ queryKey })
    assert.equal(calls, 2, 'permission changes can immediately refresh fresh data')
    const other = observe([key, 'business-b'], fetchData)
    await setImmediate()
    assert.equal(calls, 3)
    assert.equal(other.getCurrentResult().data.version, 3, 'never reuse another business or token')

    client.clear() // Sign-in and sign-out clear the in-memory query client.
    observe(queryKey, fetchData)
    await setImmediate()
    assert.equal(calls, 4, 'a new login fetches again even for the same business')
  })
}
