import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'

const source = readFileSync(new URL('../web/src/utils/auth.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { isTokenExpired, tokenExpiresAt, isCredentialRequest, shouldExpireSession } = await import(
  `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`
)
const tokenWith = (claims) => `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`

test('a business session expires at the expiry instant, including missing or invalid expiry', (t) => {
  t.mock.method(Date, 'now', () => 2_000_000)
  assert.equal(isTokenExpired(tokenWith({ exp: 2001 })), false)
  for (const token of [tokenWith({ exp: 2000 }), tokenWith({ exp: 1999 }), tokenWith({}), tokenWith({ exp: '3000' }), tokenWith({ exp: null }), tokenWith(null), null, 'invalid', 'a.b', 'a..c']) {
    assert.equal(isTokenExpired(token), true)
  }
})

test('JWT payloads use base64url and may contain non-ASCII business names', () => {
  const token = tokenWith({ exp: 3000, name: '𐀿 Clinic' })
  assert.match(token.split('.')[1], /[-_]/)
  assert.equal(tokenExpiresAt(token), 3000)
  assert.equal(tokenExpiresAt(tokenWith({ exp: '3000' })), null)
})

test('incorrect sign-in credentials stay on the form even with an old stored token', () => {
  assert.equal(isCredentialRequest('/auth/login'), true)
  assert.equal(shouldExpireSession('/auth/login', 'Bearer expired-login', 'expired-login'), false)
  assert.equal(shouldExpireSession('/auth/login', undefined, 'expired-login'), false)
  assert.equal(shouldExpireSession('/auth/signup', 'Bearer expired-login', 'expired-login'), false)
})

test('a failed request from the current session signs out, while older requests do not', () => {
  assert.equal(shouldExpireSession('/auth/me', 'Bearer current-login', 'current-login'), true)
  assert.equal(shouldExpireSession('/admin/businesses/clinic', 'Bearer current-login', 'current-login'), true)
  assert.equal(shouldExpireSession('/auth/me', 'Bearer old-login', 'new-login'), false)
  assert.equal(shouldExpireSession('/auth/me', 'Bearer old-login', null), false)
  assert.equal(shouldExpireSession('/web/businesses/clinic', undefined, 'current-login'), false)
})
