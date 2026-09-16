import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'

// Execute the actual shared TypeScript without introducing a test-runner dependency.
const source = readFileSync(
  new URL('../packages/types/src/business-routing.ts', import.meta.url),
  'utf8',
)
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { validBusinessSlug, tenantSlugFromHostname, businessPortalUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
)

test('DNS labels validate length, characters and reserved names', () => {
  for (const slug of ['bright-smile', 'clinic123', 'x'.repeat(63)])
    assert.equal(validBusinessSlug(slug), true)
  for (const slug of [
    '',
    'ab',
    'x'.repeat(64),
    'admin',
    'general',
    'some.clinic',
    '-clinic',
    'clinic-',
    'UPPER',
    'hello world',
    'clinic\n',
    'clinic\r',
  ])
    assert.equal(validBusinessSlug(slug), false)
})

test('localhost and production hostnames resolve a single business subdomain', () => {
  assert.equal(tenantSlugFromHostname('bright-smile.localhost'), 'bright-smile')
  assert.equal(tenantSlugFromHostname('BRIGHT-SMILE.LOCALHOST.'), 'bright-smile')
  assert.equal(tenantSlugFromHostname('bright-smile.example.com', 'example.com'), 'bright-smile')
  for (const host of [
    'localhost',
    '127.0.0.1',
    'admin.localhost',
    'foo.bar.localhost',
    'clinic.otherhost',
    'clinic.localhost.evil.test',
    'clinic.localhost?slug=other',
  ])
    assert.equal(tenantSlugFromHostname(host), null)
  assert.equal(tenantSlugFromHostname('clinic.notexample.com', 'example.com'), null)
})

test('portal links keep the configured protocol and port and exclude query data', () => {
  assert.equal(businessPortalUrl('my-clinic'), 'http://my-clinic.localhost:5173/login')
  assert.equal(
    businessPortalUrl('my-clinic', 'http://127.0.0.1:5173/'),
    'http://my-clinic.localhost:5173/login',
  )
  assert.equal(
    businessPortalUrl('my-clinic', 'https://example.com/app?secret=value#hash'),
    'https://my-clinic.example.com/login',
  )
  assert.throws(() => businessPortalUrl('bad.slug'))
  assert.throws(() => businessPortalUrl('my-clinic', 'javascript:alert(1)'))
  assert.throws(() => businessPortalUrl('my-clinic', 'https://username:password@example.com'))
})
