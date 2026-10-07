import { strict as assert } from 'node:assert'
const areas = ['web', 'db', 'cache', 'queue', 'auth', 'search', 'mail', 'cron', 'api', 'fs']
const enabledAreas = new Set(['web', 'db', 'cache', 'auth', 'api'])
const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const paths = ['/', '/api/v1/items/42', '/users/josé/profile', '/search?q=100%25+café', '/日本語/ページ', '/files/report 2026.pdf', '/health', '/a/b/c/d/e/f/g/h?x=1&y=2']
export const cases = Array.from({ length: 100 }, (_, i) => {
  const area = areas[Math.floor(i / 10)], ns = `app:${area}:${i % 10}`
  const input = { id: i, ns, method: methods[i % methods.length], path: `${paths[i % paths.length]}${i % 3 === 0 ? '' : `#${i}`}`, ms: (i * 37) % 1000 }
  const enabled = enabledAreas.has(area)
  return { input, enabled, expected: enabled ? `${input.method} ${input.path} took ${input.ms}ms` : '' }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, enabled, expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    if (!enabled) { assert.equal(out, '', `fixture ${i}: disabled namespace must not log`); continue }
    assert.ok(out.includes(input.ns), `fixture ${i}: namespace missing in ${JSON.stringify(out)}`)
    assert.ok(out.replace(/\n$/, '').endsWith(expected), `fixture ${i}: message mismatch in ${JSON.stringify(out)}`)
    assert.equal(out.trimEnd().split('\n').length, 1, `fixture ${i}: exactly one line`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
