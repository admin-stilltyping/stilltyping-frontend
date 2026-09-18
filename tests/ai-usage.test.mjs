import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'

const source = readFileSync(new URL('../web/src/utils/aiUsage.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { calendarDate, usageTokens, usageSeconds } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

test('unknown and partial provider counts are distinct from reported zero', () => {
  assert.equal(usageTokens(0, false), 'Not reported')
  assert.equal(usageTokens(0, true), '0')
  assert.equal(usageTokens(1200, false), '1,200+')
  assert.equal(usageTokens(1200, true), '1,200')
  assert.equal(usageSeconds(null), '—')
  assert.equal(usageSeconds(3045), '3.05 s')
  assert.equal(usageSeconds(2), '<0.01 s')
})

test('date presets follow business midnight, not the browser timezone', () => {
  const now = new Date('2026-09-18T18:30:00Z')
  assert.equal(calendarDate(0, 'Asia/Kolkata', now), '2026-09-19')
  assert.equal(calendarDate(0, 'America/Los_Angeles', now), '2026-09-18')
  assert.equal(calendarDate(6, 'Asia/Kolkata', now), '2026-09-13')
  assert.equal(calendarDate(29, 'Asia/Kolkata', now), '2026-08-21')
})

test('calendar subtraction works across leap days and daylight saving', () => {
  assert.equal(calendarDate(1, 'UTC', new Date('2024-03-01T00:00Z')), '2024-02-29')
  assert.equal(calendarDate(1, 'America/New_York', new Date('2026-03-09T04:30Z')), '2026-03-08')
})
