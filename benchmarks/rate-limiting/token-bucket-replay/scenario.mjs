import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const LENGTH = 240
// Times are whole refill intervals, so every refill lands exactly on a tick.
const intervalMs = (rate) => 1000 / rate
const generators = {
  // Many requests per tick over a dozen keys: buckets drain quickly.
  bursty: (r, nKeys) => ({ tick: () => (r() < 0.92 ? 0 : 1 + Math.floor(r() * 3)), key: () => Math.floor(r() * nKeys) }),
  // About one request per tick, spread evenly.
  steady: (r, nKeys) => ({ tick: () => (r() < 0.3 ? 1 : 0), key: (i) => i % 2 }),
  // Long idle gaps: buckets refill past their size and must stop at it.
  sparse: (r, nKeys) => ({ tick: () => (r() < 0.93 ? 0 : 12 + Math.floor(r() * 10)), key: () => Math.floor(r() * nKeys) }),
  // One key takes most of the traffic.
  hot: (r, nKeys) => ({ tick: () => (r() < 0.85 ? 0 : 1), key: () => (r() < 0.75 ? 0 : 1 + Math.floor(r() * (nKeys - 1))) }),
}
const rates = [1, 2, 4, 8]
const bursts = [1, 2, 3, 5]
// Reference: integer token counts per key, refilled one per tick.
const reference = ({ rate, burst, keys, times }) => {
  const step = intervalMs(rate)
  const buckets = new Map()
  return keys.map((k, i) => {
    const tick = times[i] / step
    let b = buckets.get(k)
    if (!b) { b = { tokens: burst, tick }; buckets.set(k, b) }
    b.tokens = Math.min(burst, b.tokens + (tick - b.tick))
    b.tick = tick
    if (b.tokens >= 1) { b.tokens--; return true }
    return false
  })
}
export const cases = Object.entries(generators).flatMap(([name, make], g) =>
  rates.flatMap((rate, ri) => [bursts[(ri + g) % 4], bursts[(ri + g + 2) % 4]].map((burst, bi) => {
    const r = rng(7 + g * 100 + ri * 10 + bi)
    const gen = make(r, 4 + 2 * ((g + ri + bi) % 4))
    const step = intervalMs(rate)
    const keys = []
    const times = []
    let tick = 0
    for (let i = 0; i < LENGTH; i++) {
      tick += gen.tick()
      keys.push('client-' + gen.key(i))
      times.push(tick * step)
    }
    const input = { rate, burst, keys, times }
    return { input, expected: reference(input) }
  })))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: decisions must be a list`)
    assert.deepStrictEqual(outputs[i], expected, `fixture ${i}: decisions`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
