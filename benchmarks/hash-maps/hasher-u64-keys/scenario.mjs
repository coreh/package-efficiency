import { strict as assert } from 'node:assert'

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261009
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const range = (n) => next() % n
const u64 = () => (BigInt(next()) << 32n) | BigInt(next())
const MAX = (1n << 64n) - 1n

// Key styles. Several are multiples of a power of two: the patterns that an
// identity hash or a weak multiplicative hash spreads badly, so a hasher's
// real cost shows. Keys are unsigned 64-bit integers, written as decimal
// strings because most do not fit a JSON number exactly.
const styles = [
  ['sequential', () => { const base = BigInt(range(1_000_000)); let j = 0n; return () => base + j++ }],
  ['random', () => u64],
  ['multiples of 2^12', () => () => BigInt(range(1 << 20)) << 12n],
  ['multiples of 2^16', () => () => BigInt(range(1 << 30)) << 16n],
  ['multiples of 2^32', () => () => BigInt(next()) << 32n],
  ['near the top, step 256', () => { let j = 0n; return () => MAX - 256n * j++ }],
]
const sizes = [16, 24, 32, 48, 64, 96, 128, 192, 256, 384, 512, 768]

const distinct = (gen, n, avoid = new Set()) => {
  const out = [], seen = new Set(avoid)
  while (out.length < n) {
    const k = gen()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

export const cases = Array.from({ length: 48 }, (_, i) => {
  const [, make] = styles[i % styles.length]
  const gen = make()
  const n = sizes[(i + Math.floor(i / styles.length) * 5) % sizes.length]
  const keys = distinct(gen, n)
  // Every fourth fixture repeats an eighth of its keys: a repeated key keeps
  // the value of its last position.
  if (i % 4 === 3) for (let r = 0; r < n / 8; r++) keys[range(n)] = keys[range(n)]
  const present = new Set(keys)
  const absent = distinct(gen, Math.floor(n / 2), present)
  const probes = []
  for (let p = 0; p < n; p++) probes.push(p % 2 === 0 ? keys[range(n)] : absent[p >> 1])
  return { input: { keys: keys.map(String), probes: probes.map(String) } }
})

// Reference: the same steps with a built-in Map over BigInt keys.
const run = ({ keys, probes }, read = BigInt) => {
  const map = new Map()
  keys.forEach((k, i) => map.set(read(k), i))
  const size = map.size
  let hits = 0, found = 0
  for (const p of probes) {
    const v = map.get(read(p))
    if (v !== undefined) { hits++; found += v }
  }
  let removed = 0
  for (let i = 0; i < keys.length; i += 3) if (map.delete(read(keys[i]))) removed++
  return [size, hits, found, removed, map.size]
}
for (const c of cases) c.expected = run(c.input)

export const verifyOne = (i, out) => {
  assert.ok(Array.isArray(out), `fixture ${i}: a list of five integers is required`)
  assert.equal(out.length, 5, `fixture ${i}: five integers are required`)
  assert.ok(out.every(Number.isSafeInteger), `fixture ${i}: integers are required`)
  assert.deepStrictEqual(out, cases[i].expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result[0]

// Wrong outputs are refused: keys read as doubles (lossy above 2^53), removals
// ignored, a lookup that misses or finds too much, another fixture's answer.
assert.throws(() => verifyResults(cases.map(({ input }) => run(input, Number))))
for (const i of cases.keys()) {
  const e = cases[i].expected
  assert.ok(e[1] > 0 && e[1] < cases[i].input.probes.length && e[3] > 0, `fixture ${i} must have hits, misses and removals`)
  assert.throws(() => verifyOne(i, [e[0], e[1], e[2], e[3], e[0]]))
  assert.throws(() => verifyOne(i, [e[0], e[1] - 1, e[2], e[3], e[4]]))
  assert.throws(() => verifyOne(i, [e[0], cases[i].input.probes.length, e[2], e[3], e[4]]))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
}
