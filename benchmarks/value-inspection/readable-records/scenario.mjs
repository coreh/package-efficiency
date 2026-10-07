import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'delta', 'café', '日本語', 'São Paulo', 'naïve 😀', 'omega']
const methods = ['GET', 'POST', 'PUT', 'DELETE']
const route = (i, j) => ({ path: `/api/v${1 + j % 3}/items/${i}-${j}`, method: methods[j % 4], auth: j % 3 === 0, timeoutMs: 250 * (j + 1), weight: j * 0.25 + 0.5 })
// Containers nest at most three levels deep: root, child, grandchild.
const record = (i) => ({
  id: i,
  name: `service-${i}`,
  enabled: i % 3 !== 0,
  ratio: i * 0.25 - 3,
  label: words[i % words.length],
  parent: i % 5 === 0 ? null : i - 1,
  owner: { name: `Owner ${i}`, email: `owner${i}@example.com`, address: { city: words[(i + 3) % words.length], zip: `${10000 + i}`, floor: i % 9 } },
  tags: words.slice(i % 4, i % 4 + 1 + (i % 5)),
  scores: Array.from({ length: 2 + i % 7 }, (_, j) => i * 7 + j * 1.5),
  flags: Object.fromEntries(Array.from({ length: 2 + i % 6 }, (_, j) => [`flag_${j}`, (i + j) % 2 === 0])),
  routes: Array.from({ length: 1 + i % 10 }, (_, j) => route(i, j)),
  empty: { list: [], map: {}, text: '' },
})
export const inputs = [
  ...Array.from({ length: 52 }, (_, i) => record(i)),
  [1, 2, 3], ['one', 'two', 'three'], [], {}, 'plain text', 4242, [0.5, -2.25, 100000],
]
const tokens = (value, out = { keys: [], strings: [], numbers: [], bools: [], length: 0 }) => {
  if (Array.isArray(value)) value.forEach((v) => tokens(v, out))
  else if (value !== null && typeof value === 'object') for (const [k, v] of Object.entries(value)) { out.keys.push(k); tokens(v, out) }
  else if (typeof value === 'string') out.strings.push(value)
  else if (typeof value === 'number') out.numbers.push(String(value))
  else if (typeof value === 'boolean') out.bools.push(String(value))
  return out
}
const count = (text, needle) => needle === '' ? 0 : text.split(needle).length - 1
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
const countNumber = (text, n) => (text.match(new RegExp(`(?<![\\d.])${escapeRe(n)}(?!\\d|\\.\\d)`, 'g')) || []).length
const tally = (list) => { const m = new Map(); for (const x of list) m.set(x, (m.get(x) || 0) + 1); return m }
export const cases = inputs.map((input) => {
  const t = tokens(input)
  return { input, keys: tally(t.keys), strings: tally(t.strings), numbers: tally(t.numbers), bools: tally(t.bools), minLength: JSON.stringify(input).replace(/[{}\[\]",:]/g, '').length }
})
const markers = ['[Object]', '[Array]', '...', '…', 'more item', '[Circular']
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, c] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    assert.ok(out.length >= c.minLength, `fixture ${i}: output too short`)
    for (const m of markers) assert.ok(!out.includes(m), `fixture ${i}: truncation marker ${m}`)
    for (const [k, n] of c.keys) assert.ok(count(out, k) >= n, `fixture ${i}: key ${k}`)
    for (const [s, n] of c.strings) if (s !== '') assert.ok(count(out, s) >= n, `fixture ${i}: string ${s}`)
    for (const [x, n] of c.numbers) assert.ok(countNumber(out, x) >= n, `fixture ${i}: number ${x}`)
    const lower = out.toLowerCase()
    for (const [b, n] of c.bools) assert.ok(count(lower, b) >= n, `fixture ${i}: boolean ${b}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
