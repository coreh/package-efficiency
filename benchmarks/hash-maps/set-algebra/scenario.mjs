import { strict as assert } from 'node:assert'

// Deterministic generator (LCG), so fixtures never change between runs.
let seed = 20261010
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const range = (n) => next() % n

// Integer styles: sequential from a small base, scattered with negatives,
// multiples of 4096, and integers above 2^31 (all exact in a double and an i64).
const styles = [
  () => { const base = range(10_000); return (j) => base + j },
  () => () => range(2_000_000_000) - 1_000_000_000,
  () => () => range(1 << 20) * 4096,
  () => () => 3_000_000_000 + range(1_000_000_000),
]
const sizes = [8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 200, 256, 320, 400]

// Overlap shapes: how b relates to a. Most are partial overlaps; a few cases
// are the edges where careless code goes wrong (disjoint, b inside a, a and b
// equal as sets, b empty).
const shapes = ['partial', 'partial', 'partial', 'mostly-shared', 'mostly-apart', 'partial', 'disjoint', 'subset', 'equal', 'empty']

const pool = (gen, n) => {
  const out = [], seen = new Set()
  for (let j = 0; out.length < n; j++) {
    const k = gen(j)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}
// A list of n entries drawn from the distinct values, every one of them at
// least once when n allows, with repeats, in scrambled order.
const draw = (values, n) => {
  const out = values.slice(0, n)
  while (out.length < n) out.push(values[range(values.length)])
  for (let j = out.length - 1; j > 0; j--) { const r = range(j + 1); [out[j], out[r]] = [out[r], out[j]] }
  return out
}

export const cases = Array.from({ length: 40 }, (_, i) => {
  const n = sizes[(i * 3) % sizes.length]
  const m = sizes[(i * 5 + 4) % sizes.length]
  const shape = shapes[i % shapes.length]
  const gen = styles[i % styles.length]()
  // Distinct values: about three quarters of each list's length, so every
  // list has repeats.
  const da = Math.max(4, Math.floor(n * 0.75))
  const db = Math.max(4, Math.floor(m * 0.75))
  const shared = shape === 'partial' ? Math.floor(Math.min(da, db) * (0.2 + range(50) / 100))
    : shape === 'mostly-shared' ? Math.floor(Math.min(da, db) * 0.9)
      : shape === 'mostly-apart' ? 1 : 0
  const values = pool(gen, da + db)
  const va = values.slice(0, da)
  let vb
  if (shape === 'subset') vb = va.slice(0, Math.max(2, Math.floor(da / 2)))
  else if (shape === 'equal') vb = va.slice()
  else if (shape === 'empty') vb = []
  else vb = [...va.slice(0, shared), ...values.slice(da, da + db - shared)]
  const a = draw(va, n)
  const b = vb.length === 0 ? [] : draw(vb, shape === 'equal' ? n + 3 : Math.max(m, vb.length))
  return { input: { a, b } }
})

// Reference: the three sets with built-in Sets and plain loops, sorted.
const byValue = (x, y) => x - y
const reference = ({ a, b }) => {
  const sa = new Set(a), sb = new Set(b)
  const union = new Set(a)
  for (const k of b) union.add(k)
  const intersection = [...sa].filter((k) => sb.has(k))
  const difference = [...sa].filter((k) => !sb.has(k))
  return [[...union].sort(byValue), intersection.sort(byValue), difference.sort(byValue)]
}
for (const c of cases) c.expected = reference(c.input)

const names = ['union', 'intersection', 'difference']
// A set may arrive as a JavaScript Set (or any iterable set type) or, from
// the other languages, as a JSON list in any order. It is read as a list and
// sorted; duplicates are kept, so a list that repeats a value is refused.
const members = (i, name, value) => {
  assert.ok(value !== null && typeof value === 'object' && typeof value[Symbol.iterator] === 'function',
    `fixture ${i}: ${name} must be a set or a list`)
  const list = Array.from(value)
  assert.ok(list.every(Number.isSafeInteger), `fixture ${i}: ${name} must hold integers`)
  return list.sort(byValue)
}

export const verifyOne = (i, out) => {
  assert.ok(out !== null && typeof out === 'object' && typeof out[Symbol.iterator] === 'function',
    `fixture ${i}: a list of three sets is required`)
  const parts = Array.from(out)
  assert.equal(parts.length, 3, `fixture ${i}: three sets are required (union, intersection, difference)`)
  for (const [j, name] of names.entries()) {
    assert.deepStrictEqual(members(i, name, parts[j]), cases[i].expected[j], `fixture ${i}: ${name}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => {
  const u = result[0]
  return u.size ?? u.length
}

// Wrong outputs are refused: lists concatenated instead of a union, the input
// returned, intersection and difference swapped, b - a instead of a - b, a set
// missing one member, another fixture's answer.
const differs = (x, y) => JSON.stringify(x) !== JSON.stringify(y)
let swapped = 0, reversed = 0
for (const [i, { input, expected }] of cases.entries()) {
  const [u, n, d] = expected
  assert.ok(input.a.length > new Set(input.a).size, `fixture ${i} must repeat values in a`)
  assert.throws(() => verifyOne(i, [[...input.a, ...input.b], n, d]))
  assert.throws(() => verifyOne(i, [input.a, input.b, input.a]))
  assert.throws(() => verifyOne(i, [u.slice(1), n, d]))
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected))
  if (differs(n, d)) { swapped++; assert.throws(() => verifyOne(i, [u, d, n])) }
  const ba = [...new Set(input.b)].filter((k) => !input.a.includes(k)).sort(byValue)
  if (differs(ba, d)) { reversed++; assert.throws(() => verifyOne(i, [u, n, ba])) }
  if (n.length > 0) assert.throws(() => verifyOne(i, [u, n.slice(1), d]))
  verifyOne(i, [new Set([...u].reverse()), new Set(n), new Set(d)])
}
assert.ok(swapped === cases.length && reversed >= cases.length - 4, 'the fixtures must tell the three operations apart')
assert.ok(cases.some(({ expected }) => expected[1].length === 0) && cases.some(({ expected }) => expected[2].length === 0),
  'the fixtures must include an empty intersection and an empty difference')
