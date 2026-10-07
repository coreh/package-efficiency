import { strict as assert } from 'node:assert'
// Each input is an object of unique plain keys to non-empty string values. A correct result
// is a query string that decodes back to exactly that map.
const keyPool = ['q', 'page', 'user_id', 'utm_source', 'utm-medium', 'sort', 'filter', 'lang', 'redirect', 'token', 'name', 'city', 'tag', 'ref', 'session', 'sku', 'color', 'size', 'note', 'callback', 'min_price', 'max_price', 'brand', 'currency', 'country', 'région', '名前', 'emoji', 'a', 'b']
const valuePool = [
  'hello world', 'a+b=c', 'https://example.com/path?x=1&y=2#top', 'café au lait', '日本語のテキスト', '😀 party 🎉',
  '50% off', 'a&b&c', 'x=y=z', '[1,2,3]', 'line one/line two', 'plain', '12345', 'true', 'Ünïcödé Straße',
  'a b  c', '~tilde_and-dash.dot', "it's (quoted) *star* !bang", 'tab\there', 'rock & roll', 'C++ & C#', '/usr/local/bin', 'x'.repeat(40), 'ÀÉÎÕÜ ñ ç'
]
const build = (i) => {
  const n = i === 0 ? 1 : 1 + ((i * 7) % 30)
  const input = {}
  for (let k = 0; k < n; k++) {
    const key = keyPool[(i * 7 + k) % keyPool.length]
    if (key in input) continue
    input[key] = k % 3 === 2 ? valuePool[(i + k * 7) % valuePool.length] + valuePool[(i * 3 + k) % valuePool.length] : valuePool[(i * 3 + k * 5) % valuePool.length]
  }
  return { input }
}
export const cases = Array.from({ length: 47 }, (_, i) => build(i))
const decode = (s) => decodeURIComponent(s.replace(/\+/g, ' '))
const canonical = (pairs) => pairs.slice().sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
const decodeQuery = (q) => {
  if (q === '') return []
  return q.split('&').map((part) => {
    const at = part.indexOf('=')
    assert.ok(at > 0, `pair without key or "=": ${part}`)
    return [decode(part.slice(0, at)), decode(part.slice(at + 1))]
  })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    assert.ok(/^[\x21-\x7e]*$/.test(out), `fixture ${i}: output must be printable ASCII without spaces`)
    assert.deepEqual(canonical(decodeQuery(out)), canonical(Object.entries(input)), `fixture ${i}: ${out}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
