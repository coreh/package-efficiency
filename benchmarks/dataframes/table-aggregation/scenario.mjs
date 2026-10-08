import { strict as assert } from 'node:assert'
// A table of 20,000 rows with three integer columns, generated from a seeded
// generator:
//   key    group key, 0 .. keys-1
//   qty    1 .. 100
//   amount 0 .. 99999
// The input of a fixture is { key, qty, amount, min } (three columns of equal
// length and the threshold). Adapters build their library's table from it in
// `prepare`, which is not timed. The operation keeps the rows with qty >= min,
// groups them by key and returns one row per group:
//   [key, sum of amount, mean of qty]
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const ROWS = 20000
const shapes = [
  { keys: 12, min: 30 },
  { keys: 40, min: 50 },
  { keys: 100, min: 70 },
  { keys: 250, min: 10 },
]
const build = ({ keys, min }, n) => {
  const rand = mulberry32(1000 + n)
  const key = [], qty = [], amount = []
  for (let r = 0; r < ROWS; r++) {
    // Skewed keys, so that groups differ in size.
    key.push(Math.floor(rand() * rand() * keys))
    qty.push(1 + Math.floor(rand() * 100))
    amount.push(Math.floor(rand() * 100000))
  }
  const sums = new Map(), counts = new Map(), qsums = new Map()
  for (let r = 0; r < ROWS; r++) {
    if (qty[r] < min) continue
    sums.set(key[r], (sums.get(key[r]) ?? 0) + amount[r])
    qsums.set(key[r], (qsums.get(key[r]) ?? 0) + qty[r])
    counts.set(key[r], (counts.get(key[r]) ?? 0) + 1)
  }
  const expected = new Map()
  for (const [k, c] of counts) expected.set(k, { sum: sums.get(k), mean: qsums.get(k) / c })
  return { input: { key, qty, amount, min }, expected }
}
export const cases = shapes.map(build)

// Rows are compared as a set by key: any order, each key exactly once, the
// sum exactly, the mean within 1e-9. Numbers may be integers or floats.
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(Array.isArray(output) || (output && typeof output.length === 'number'), `fixture ${i}: a list of rows is required`)
  const seen = new Set()
  for (const row of output) {
    assert.equal(row.length, 3, `fixture ${i}: a row is [key, sum, mean]`)
    const [k, s, m] = [Number(row[0]), Number(row[1]), Number(row[2])]
    assert.ok(expected.has(k), `fixture ${i}: unexpected group ${row[0]}`)
    assert.ok(!seen.has(k), `fixture ${i}: group ${k} appears twice`)
    seen.add(k)
    const want = expected.get(k)
    assert.equal(s, want.sum, `fixture ${i}: sum of group ${k}`)
    assert.ok(Math.abs(m - want.mean) <= 1e-9, `fixture ${i}: mean of group ${k}: ${m} against ${want.mean}`)
  }
  assert.equal(seen.size, expected.size, `fixture ${i}: ${seen.size} groups against ${expected.size}`)
}
// The check can fail: grouping without the filter gives other sums.
for (const [n, { input, expected }] of cases.entries()) {
  const all = new Map()
  input.key.forEach((k, r) => all.set(k, (all.get(k) ?? 0) + input.amount[r]))
  assert.ok([...expected].some(([k, { sum }]) => all.get(k) !== sum), `fixture ${n}: the filter must matter`)
  assert.ok(expected.size > 1, `fixture ${n}: several groups`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (rows) => rows.length
