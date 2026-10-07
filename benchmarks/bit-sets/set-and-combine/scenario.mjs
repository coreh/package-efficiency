import { strict as assert } from 'node:assert'
// Deterministic fixtures: a linear congruential generator picks positions.
const rng = (seed) => {
  let s = seed >>> 0
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0)
}
const sizes = [64, 100, 128, 257, 512, 1000, 1024, 2048, 3000, 4096]
const make = (i) => {
  const size = sizes[i % sizes.length]
  const next = rng(1000 + i * 7919)
  const pick = (n) => Array.from({ length: n }, () => (next() >>> 8) % size)
  const base = Math.max(5, Math.floor(size * (0.05 + ((i * 3) % 10) * 0.04)))
  let a = pick(Math.min(base, 1500))
  let b = pick(Math.min(Math.floor(base * 0.8) + 3, 1500))
  const kind = i % 12
  if (kind === 3) a = []
  else if (kind === 5) b = Array.from({ length: size }, (_, k) => k)
  else if (kind === 7) b = a.slice().reverse()
  else if (kind === 9) { a = a.filter((p) => p % 2 === 0); b = b.filter((p) => p % 2 === 1) }
  else if (kind === 11) { a = [0, size - 1, size >> 1]; b = [size - 1, 1] }
  const A = new Set(a), B = new Set(b)
  const union = new Set([...A, ...B])
  const inter = [...A].filter((p) => B.has(p))
  return { input: { size, a, b }, expected: [A.size, B.size, union.size, inter.length] }
}
const counts = (size, a, b) => {
  const A = new Set(a), B = new Set(b)
  const union = new Set([...A, ...B])
  const inter = [...A].filter((p) => B.has(p))
  return { input: { size, a, b }, expected: [A.size, B.size, union.size, inter.length] }
}
// Large, sparse universes: few positions in 65,536 to 1,000,000 bits, so the
// union, the intersection and the counts (which walk every word) outweigh
// setting the bits.
const largeSizes = [65536, 100000, 131072, 262144, 524288, 1000000]
const makeLarge = (j) => {
  const size = largeSizes[j % largeSizes.length]
  const next = rng(500000 + j * 104729)
  const pick = (n) => Array.from({ length: n }, () => next() % size)
  let a = pick([8, 32, 128, 512][j % 4])
  let b = pick([256, 16, 64, 24][j % 4])
  const kind = j % 6
  if (kind === 2) b = b.concat(a.slice(0, a.length >> 1)) // guaranteed overlap
  else if (kind === 3) b = a.slice().reverse()
  else if (kind === 4) { a = a.filter((p) => p % 2 === 0); b = b.filter((p) => p % 2 === 1) }
  else if (kind === 5) { a = [0, size - 1, size >> 1]; b = [size - 1, 1] }
  return counts(size, a, b)
}
export const cases = [...Array.from({ length: 36 }, (_, i) => make(i)), ...Array.from({ length: 12 }, (_, j) => makeLarge(j))]
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array output required`)
    assert.deepStrictEqual(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
