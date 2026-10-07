import { strict as assert } from 'node:assert'

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261006
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const range = (n) => next() % n
const hex = (n) => Array.from({ length: n }, () => '0123456789abcdef'[range(16)]).join('')

const makeInts = (n, style) => {
  const keys = []
  for (let i = 0; i < n; i++) {
    if (style === 0) keys.push(1000 + i)
    else if (style === 1) keys.push(range(2_000_000_000) - 1_000_000_000)
    else if (style === 2) keys.push(i * 4096 + 7)
    else keys.push(range(2_000_000) + 3_000_000_000)
  }
  return keys
}
const makeStrings = (n, style) => {
  const keys = []
  for (let i = 0; i < n; i++) {
    if (style === 0) keys.push(`user:${100000 + range(900000)}`)
    else if (style === 1) keys.push(`/api/v${1 + range(3)}/${['items', 'orders', 'users', 'search'][range(4)]}/${range(5000)}`)
    else if (style === 2) keys.push(hex(32))
    else keys.push(`key-${i}`)
  }
  return keys
}
const withRepeats = (keys) => {
  const n = keys.length
  if (n < 8) return keys
  for (let i = 0; i < Math.floor(n / 8); i++) keys[range(n)] = keys[range(n)]
  return keys
}
const sizes = [4, 5, 8, 12, 16, 20, 24, 32, 40, 48, 60, 64, 72, 80, 96, 100, 110, 120, 128, 140, 150, 160]
const make = (list, absent, n, probeCount) => {
  const present = new Set(list)
  const probes = []
  for (let i = 0; i < probeCount; i++) {
    if (i % 2 === 0) probes.push(list[range(list.length)])
    else {
      let k
      do { k = absent() } while (present.has(k))
      probes.push(k)
    }
  }
  return probes
}
export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = sizes[i % sizes.length] + (i >= sizes.length ? i % 7 : 0)
  const m = sizes[(i * 5 + 3) % sizes.length]
  const ints = makeInts(n, i % 4)
  const strings = makeStrings(m, i % 4)
  if (i % 3 === 0) { withRepeats(ints); withRepeats(strings) }
  const intProbes = make(ints, () => range(4_000_000_000) - 2_000_000_000, n, 2 * Math.ceil(n / 2))
  const stringProbes = make(strings, () => `missing/${hex(6)}`, m, 2 * Math.ceil(m / 2))
  return { input: { ints, intProbes, strings, stringProbes } }
})

// Reference: the same steps with a built-in Map.
const side = (keys, probes, weight) => {
  let map = new Map()
  keys.forEach((k, i) => map.set(k, i))
  const size = map.size
  let hits = 0, found = 0
  for (const p of probes) if (map.has(p)) { hits++; found += map.get(p) }
  let ksum = 0, vsum = 0
  for (const [k, v] of map) { ksum += weight(k); vsum += v }
  for (let i = 0; i < keys.length; i += 2) map.delete(keys[i])
  let left = 0
  for (const p of probes) if (map.has(p)) left++
  return [size, hits, found, ksum, vsum, map.size, left]
}
const expected = ({ ints, intProbes, strings, stringProbes }) => [
  ...side(ints, intProbes, (k) => k),
  ...side(strings, stringProbes, (k) => k.length),
]
for (const c of cases) c.expected = expected(c.input)

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: a list of integers is required`)
    assert.equal(out.length, 14, `fixture ${i}: 14 numbers required`)
    assert.ok(out.every(Number.isInteger), `fixture ${i}: integers required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0]
