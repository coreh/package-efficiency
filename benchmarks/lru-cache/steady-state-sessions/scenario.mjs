import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const LENGTH = 5000
const name = (n) => `session:${(n * 2654435761 % 4294967296).toString(36)}${n % 7 === 0 ? ':' + 'x'.repeat(n % 13) : ''}`
const generators = {
  // Skewed popularity over a universe several times the capacity.
  zipf: (cap, r) => Array.from({ length: LENGTH }, () => name(Math.floor(cap * 6 * r() ** 3))),
  // Uniform over twice the capacity.
  uniform: (cap, r) => Array.from({ length: LENGTH }, () => name(Math.floor(cap * 2 * r()))),
  // A hot set revisited between runs of one-off keys.
  scan: (cap, r) => Array.from({ length: LENGTH }, (_, i) => i % 3 === 0 ? name(Math.floor(r() * cap / 2)) : name(1000000 + i)),
  // The working set shifts halfway through.
  shift: (cap, r) => Array.from({ length: LENGTH }, (_, i) => name((i < LENGTH / 2 ? 0 : 7777777) + Math.floor(r() * cap * 1.5))),
}
// Every 11th operation (index % 11 == 10) removes its key; the others read it,
// and on a miss store the operation index as the value. Result:
// [hits, sum of values read on hits, removals that found a key, final size].
// A Map keeps insertion order, so re-inserting on a hit makes the first key
// the least recently used.
const reference = ({ capacity, keys }) => {
  const m = new Map()
  let hits = 0, sum = 0, removed = 0
  keys.forEach((k, i) => {
    if (i % 11 === 10) { if (m.delete(k)) removed++ }
    else if (m.has(k)) { hits++; const v = m.get(k); sum += v; m.delete(k); m.set(k, v) }
    else { m.set(k, i); if (m.size > capacity) m.delete(m.keys().next().value) }
  })
  return [hits, sum, removed, m.size]
}
const caps = [100, 250, 500, 1000, 2000, 3000]
export const cases = Object.entries(generators).flatMap(([, make], g) =>
  caps.map((capacity, c) => {
    const input = { capacity, keys: make(capacity, rng(7 + g * 100 + c)) }
    return { input, expected: reference(input) }
  }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepStrictEqual(outputs[i], expected, `fixture ${i}: [hits, sum, removed, size]`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0]
