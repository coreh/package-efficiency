import { strict as assert } from 'node:assert'
// Deterministic fixtures: a linear congruential generator picks positions.
const rng = (seed) => {
  let s = seed >>> 0
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0)
}
const build = (size, a, b) => {
  const A = new Set(a), B = new Set(b)
  const diff = [...A].filter((p) => !B.has(p)).sort((x, y) => x - y)
  const sym = [...new Set([...A, ...B])].filter((p) => !(A.has(p) && B.has(p))).sort((x, y) => x - y)
  return { input: { size, a, b }, expected: [diff, sym] }
}
const mediumSizes = [512, 1024, 2048, 3000, 4096, 8192, 10000, 16384, 32768, 65536, 20000, 5000]
const medium = (i) => {
  const size = mediumSizes[i % mediumSizes.length]
  const next = rng(7000 + i * 6007)
  const pick = (n) => Array.from({ length: n }, () => (next() >>> 8) % size)
  const da = [0.05, 0.1, 0.2, 0.35, 0.5, 0.15][i % 6]
  const db = [0.3, 0.05, 0.5, 0.1, 0.25, 0.4][(i + 2) % 6]
  const a = pick(Math.floor(size * da))
  let b = pick(Math.floor(size * db))
  if (i % 4 === 1) b = b.concat(a.slice(0, a.length >> 1))
  return build(size, a, b)
}
const largeSizes = [100000, 131072, 262144, 524288, 1000000]
const large = (j) => {
  const size = largeSizes[j % largeSizes.length]
  const next = rng(90000 + j * 104729)
  const pick = (n) => Array.from({ length: n }, () => next() % size)
  const a = pick([40, 300, 2000, 120, 800][j % 5])
  let b = pick([500, 60, 1000, 2000, 90][j % 5])
  if (j % 3 === 0) b = b.concat(a.slice(0, a.length >> 1))
  return build(size, a, b)
}
const edge = (k) => {
  const size = [777, 4096, 2500, 65536, 1000, 640][k]
  const next = rng(31 + k)
  const pick = (n) => Array.from({ length: n }, () => (next() >>> 8) % size)
  const a = pick(size >> 2)
  switch (k) {
    case 0: return build(size, [], pick(size >> 2))
    case 1: return build(size, a, [])
    case 2: return build(size, a, a.slice().reverse())
    case 3: return build(size, a.filter((p) => p % 2 === 0), pick(size >> 2).filter((p) => p % 2 === 1))
    case 4: return build(size, [0, size - 1, size >> 1], [size - 1, 1])
    default: return build(size, a, Array.from({ length: size }, (_, p) => p))
  }
}
export const cases = [
  ...Array.from({ length: 24 }, (_, i) => medium(i)),
  ...Array.from({ length: 10 }, (_, j) => large(j)),
  ...Array.from({ length: 6 }, (_, k) => edge(k)),
]
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 2, `fixture ${i}: two lists required`)
    assert.deepStrictEqual(out, expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length + value[1].length
