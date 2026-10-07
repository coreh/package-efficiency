import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const LENGTH = 240
const generators = {
  // Skewed popularity: a few hot keys, a long tail.
  zipf: (cap, r) => Array.from({ length: LENGTH }, () => Math.floor(cap * 8 * r() ** 3)),
  uniform: (cap, r) => Array.from({ length: LENGTH }, () => Math.floor(cap * 2 * r())),
  // Cyclic scan one larger than capacity: strict LRU never hits.
  thrash: (cap) => Array.from({ length: LENGTH }, (_, i) => 1000 + (i % (cap + 1))),
  // Cyclic scan that fits: hits after the first pass.
  loop: (cap) => Array.from({ length: LENGTH }, (_, i) => 5000 + (i % cap)),
  // Hot set revisited between runs of one-off keys.
  scan: (cap, r) => Array.from({ length: LENGTH }, (_, i) => i % 3 === 0 ? Math.floor(r() * cap / 2) : 100000 + i),
  // The working set shifts halfway through.
  shift: (cap, r) => Array.from({ length: LENGTH }, (_, i) => (i < LENGTH / 2 ? 0 : 7777) + Math.floor(r() * cap * 1.5)),
}
// Reference implementation: a Map keeps insertion order, so re-inserting a key
// on every hit makes the first key always the least recently used.
const reference = ({ capacity, keys }) => {
  const m = new Map()
  let hits = 0
  for (const k of keys) {
    if (m.has(k)) { hits++; m.delete(k); m.set(k, 1) }
    else { m.set(k, 1); if (m.size > capacity) m.delete(m.keys().next().value) }
  }
  return hits
}
const caps = [1, 2, 8, 16, 32, 64]
export const cases = Object.entries(generators).flatMap(([name, make], g) =>
  caps.map((capacity, c) => {
    const input = { capacity, keys: make(capacity, rng(1 + g * 100 + c)) }
    return { input, expected: reference(input) }
  }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i}: hit count`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
