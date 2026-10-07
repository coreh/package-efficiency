import { strict as assert } from 'node:assert'
// Input: a Cookie header string. Correct output: a map { name: value } with
// every value exactly as written (key order is not compared).
const b64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_'
const token = (i, n) => Array.from({ length: n }, (_, k) => b64[(i * 7 + k * 13 + k * k) % b64.length]).join('')
const pool = [
  (i) => ['session_id', token(i, 32)],
  (i) => ['csrftoken', token(i + 3, 43)],
  (i) => ['theme', ['dark', 'light', 'auto'][i % 3]],
  (i) => ['lang', ['en-US', 'pt-BR', 'ja-JP', 'de'][i % 4]],
  (i) => ['_ga', `GA1.2.${1000000 + i * 7919}.${1700000000 + i * 31}`],
  (i) => ['cart', String(i * 3 % 17)],
  (i) => ['consent', i % 2 ? 'true' : 'false'],
  (i) => ['empty', ''],
  (i) => ['user-id', String(100000 + i * 13)],
  (i) => ['__Host-token', token(i + 9, 24)],
  (i) => ['ab.test', `variant-${i % 5}`],
  (i) => ['jwt', `${token(i, 36)}.${token(i + 1, 80)}.${token(i + 2, 43)}`],
  (i) => ['last_seen', `2026-10-${String(1 + i % 28).padStart(2, '0')}T12:00:00Z`.replace(/:/g, '_')],
  (i) => ['long', token(i, 300 + i)],
]
export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = 1 + (i * 5) % 12
  const expected = {}
  for (let k = 0; k < n; k++) {
    const [name, value] = pool[(i * 3 + k * 5) % pool.length](i + k)
    expected[k < pool.length && name in expected ? `${name}${k}` : name] = value
  }
  const input = Object.entries(expected).map(([k, v]) => `${k}=${v}`).join('; ')
  return { input, expected }
})
const plain = (o) => Object.fromEntries(Object.entries(o))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out !== null && typeof out === 'object' && !Array.isArray(out), `fixture ${i}: map required`)
    assert.deepStrictEqual(plain(out), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// The timed loop calls consume on every result, so it must not allocate:
// Object.keys would build an array per call, which only JavaScript would pay.
// Every non-empty fixture contains at least one of the names read here
// (asserted below), so the value depends on the result.
const has = (x) => x === undefined ? 0 : 1
export const consume = (value) => has(value.session_id) + has(value.theme) + has(value['user-id']) + has(value.csrftoken) + has(value['ab.test'])
for (const [i, { expected }] of cases.entries()) assert.ok(consume(expected) > 0, `fixture ${i}: consume must read at least one cookie`)
