import { strict as assert } from 'node:assert'
// Each input is a query string (no leading "?"). A correct result maps every key to its
// decoded string value. Keys are unique, plain, and never numeric. No value is empty.
const keyPool = ['q', 'page', 'user_id', 'utm_source', 'utm-medium', 'sort', 'filter', 'lang', 'redirect', 'token', 'name', 'city', 'tag', 'ref', 'session', 'sku', 'color', 'size', 'note', 'callback', 'min_price', 'max_price', 'brand', 'currency', 'country', 'région', '名前', 'emoji', 'a', 'b']
const valuePool = [
  'hello world', 'a+b=c', 'https://example.com/path?x=1&y=2#top', 'café au lait', '日本語のテキスト', '😀 party 🎉',
  '50% off', 'a&b&c', 'x=y=z', '[1,2,3]', 'line one/line two', 'plain', '12345', 'true', 'Ünïcödé Straße',
  'a b  c', '~tilde_and-dash.dot', "it's (quoted) *star* !bang", 'tab\there', 'rock & roll', 'C++ & C#', '/usr/local/bin', 'x'.repeat(40), 'ÀÉÎÕÜ ñ ç'
]
const enc = (s, plus) => { const e = encodeURIComponent(s); return plus ? e.replace(/%20/g, '+') : e }
const build = (i) => {
  const n = i === 0 ? 1 : 1 + ((i * 7) % 30)
  const used = new Set()
  const pairs = []
  for (let k = 0; k < n; k++) {
    const key = keyPool[(i * 7 + k) % keyPool.length]
    if (used.has(key)) continue
    used.add(key)
    const value = k % 3 === 2 ? valuePool[(i + k * 7) % valuePool.length] + valuePool[(i * 3 + k) % valuePool.length] : valuePool[(i * 3 + k * 5) % valuePool.length]
    pairs.push([key, value])
  }
  const plus = i % 2 === 0
  const input = pairs.map(([k, v]) => `${enc(k, plus)}=${enc(v, plus)}`).join('&')
  return { input, expected: Object.fromEntries(pairs) }
}
export const cases = Array.from({ length: 47 }, (_, i) => build(i))
cases.push({ input: '', expected: {} })
const canonical = (r) => {
  assert.ok(r && typeof r === 'object' && !Array.isArray(r), 'a key-to-value map is required')
  const entries = Object.entries(r)
  for (const [k, v] of entries) assert.equal(typeof v, 'string', `value for ${k} must be a string`)
  return entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(canonical(outputs[i]), canonical(expected), `fixture ${i}: ${cases[i].input}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// The timed loop calls consume on every result, so it must not allocate:
// Object.keys would build an array per call, which only JavaScript would pay.
// Every non-empty fixture contains at least one of the names read here
// (asserted below), so the value depends on the result.
const has = (x) => x === undefined ? 0 : 1
export const consume = (value) => has(value.q) + has(value.session) + has(value.filter) + has(value.user_id) + 1
for (const [i, { expected }] of cases.entries()) assert.ok(Object.keys(expected).length === 0 || consume(expected) > 1, `fixture ${i}: consume must read at least one key`)
