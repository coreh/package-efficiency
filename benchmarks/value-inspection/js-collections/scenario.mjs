import { strict as assert } from 'node:assert'
class Point { constructor(x, y) { this.x = x; this.y = y } }
class Dimension { constructor(w, h) { this.width = w; this.height = h; this.unit = 'px' } }
class Money { constructor(amount, currency) { this.amount = amount; this.currency = currency } }
const words = ['alpha', 'beta', 'gamma', 'delta', 'café', '日本語', 'São Paulo', 'naïve 😀', 'omega']
const scopes = ['read', 'write', 'admin', 'billing', 'audit', 'deploy']
const currencies = ['USD', 'EUR', 'BRL', 'JPY', 'GBP']
// Mid-year, midday dates, so the year is the same in every time zone.
const date = (i) => new Date(Date.UTC(2020 + i % 7, 5, 10 + i % 15, 12, i % 60, 0))
// Containers nest at most three levels deep, because several packages collapse deeper levels by default.
const sessions = (i) => new Map(Array.from({ length: 2 + i % 5 }, (_, j) => [`sess-${i}-${j}`, {
  user: words[(i + j) % words.length], expiresAt: date(i + j), hits: i * 3 + j, scopes: new Set(scopes.slice(j % 3, j % 3 + 1 + (i % 3))),
}]))
const order = (i) => ({
  id: 9007199254740993n + BigInt(i * 1000003),
  placedAt: date(i),
  customer: { name: `Customer ${i}`, vip: i % 4 === 0, note: undefined, region: words[i % words.length] },
  items: Array.from({ length: 1 + i % 6 }, (_, j) => ({ sku: `SKU-${i}-${j}`, qty: 1 + j, price: j * 2.75 + 0.5 })),
  totals: new Map(currencies.slice(0, 1 + i % 4).map((c, j) => [c, i * 12.5 + j])),
})
const shapes = (i) => ({
  origin: new Point(i, i * 0.5 - 4),
  size: new Dimension(100 + i, 50 + i * 2),
  price: new Money(i * 3.25, currencies[i % currencies.length]),
  pattern: new RegExp(`^id-${i}-[a-z]+$`, i % 2 ? 'gi' : 'u'),
  tags: new Set(words.slice(i % 4, i % 4 + 2 + i % 4)),
  parent: undefined,
  label: words[i % words.length],
})
const graph = (i) => new Map(Array.from({ length: 3 + i % 6 }, (_, j) => [j + i * 10, new Set(Array.from({ length: 1 + (i + j) % 4 }, (_, k) => (j + k + 1) * 7 + i))]))
const matrix = (i) => Array.from({ length: 2 + i % 3 }, (_, j) => new Map(Array.from({ length: 2 + (i + j) % 3 }, (_, k) => [`col${k}`, i * 1.5 + j * 10 + k])))
const config = (i) => ({
  name: `job-${i}`,
  limits: new Map([['cpu', 0.25 * (i + 1)], ['memory', 256 * (1 + i % 8)], ['pids', 100 + i]]),
  allowed: new Set([`10.0.${i}.1`, `10.0.${i}.2`, `192.168.${i}.7`]),
  schedule: { startsAt: date(i), endsAt: date(i + 3), pattern: /\d+ \d+ \* \* \*/ },
  retries: i % 5, disabled: i % 3 === 0, owner: undefined,
})
export const inputs = [
  ...Array.from({ length: 8 }, (_, i) => sessions(i + 1)),
  ...Array.from({ length: 8 }, (_, i) => order(i + 1)),
  ...Array.from({ length: 8 }, (_, i) => shapes(i + 1)),
  ...Array.from({ length: 6 }, (_, i) => graph(i + 1)),
  ...Array.from({ length: 6 }, (_, i) => matrix(i + 1)),
  ...Array.from({ length: 6 }, (_, i) => config(i + 1)),
  new Map(), new Set(), new Map([['only', 1]]), new Set(['one', 'two', 'three']), date(3), 123456789012345678901234567890n,
  new Point(3, 4), /ab+c/gi, [new Set([1, 2]), new Map([[1, 'one']])], undefined,
]
const classNames = ['Point', 'Dimension', 'Money']
const tokens = (value, out = { keys: [], strings: [], numbers: [], undef: 0, kinds: [], names: [], length: 0 }) => {
  if (value === undefined) out.undef++
  else if (value instanceof Date) { out.numbers.push(String(value.getUTCFullYear())); out.length += 4 }
  else if (value instanceof RegExp) { out.strings.push(String(value)); out.length += String(value).length }
  else if (value instanceof Map) { out.kinds.push('Map'); for (const [k, v] of value) { tokens(k, out); tokens(v, out) } }
  else if (value instanceof Set) { out.kinds.push('Set'); for (const v of value) tokens(v, out) }
  else if (Array.isArray(value)) value.forEach((v) => tokens(v, out))
  else if (value !== null && typeof value === 'object') {
    if (classNames.includes(value.constructor.name)) { out.names.push(value.constructor.name); out.length += value.constructor.name.length }
    for (const [k, v] of Object.entries(value)) { out.keys.push(k); out.length += k.length; tokens(v, out) }
  } else if (typeof value === 'string') { out.strings.push(value); out.length += value.length }
  else if (typeof value === 'number' || typeof value === 'bigint') { out.numbers.push(String(value)); out.length += String(value).length }
  return out
}
const count = (text, needle) => needle === '' ? 0 : text.split(needle).length - 1
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')
const countNumber = (text, n) => (text.match(new RegExp(`(?<![\\d.])${escapeRe(n)}(?!\\d|\\.\\d)`, 'g')) || []).length
const tally = (list) => { const m = new Map(); for (const x of list) m.set(x, (m.get(x) || 0) + 1); return m }
export const cases = inputs.map((input) => {
  const t = tokens(input)
  return { input, keys: tally(t.keys), strings: tally(t.strings), numbers: tally(t.numbers), kinds: tally(t.kinds), names: tally(t.names), undef: t.undef, minLength: t.length }
})
const markers = ['[Object]', '[Array]', '[Map', '[Set', '[Point', '[Dimension', '[Money', '[Circular', '...', '…', 'more item']
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
    for (const [k, n] of c.kinds) assert.ok(count(out, k) >= n, `fixture ${i}: container kind ${k}`)
    for (const [k, n] of c.names) assert.ok(count(out, k) >= n, `fixture ${i}: class name ${k}`)
    assert.ok(count(out, 'undefined') >= c.undef, `fixture ${i}: undefined`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
