import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const NAMES = ['connect', 'disconnect', 'message', 'error', 'data:chunk', 'data:end', 'user.login', 'tick']
const shapes = {
  uniform: (n, r) => Math.floor(r() * (n + 1)),
  skewed: (n, r) => Math.floor((n + 1) * r() ** 3),
  cycle: (n, r, i) => i % (n + 1),
  // Mostly rare names: one-shot listeners often stay armed for a long time.
  sparse: (n, r) => (r() < 0.7 ? n : Math.floor(r() * n)),
}
const nameCounts = [1, 2, 3, 5, 8, 8, 4, 6]
export const cases = Object.values(shapes).flatMap((pick, s) =>
  nameCounts.map((count, c) => {
    const r = rng(11 + s * 37 + c)
    const length = 100 + ((s * 8 + c) * 13) % 101
    const names = NAMES.slice(0, count)
    // Index === count means an event nobody listens to.
    const events = Array.from({ length }, (_, i) => [pick(count, r, i) % (count + 1), Math.floor(r() * 2001) - 1000, Math.floor(r() * 2001) - 1000])
      .map(([k, a, b]) => [k === count ? 'unheard' : names[k], a, b])
    return { input: { names, events }, expected: reference({ names, events }) }
  }))
// Listeners j = 0..5: even j persistent, odd j one-shot. One-shots are armed
// at the start and a second set is added after half of the events (any set
// still armed then stays, so a name may hold two sets).
function reference({ names, events }) {
  const armed = new Map(names.map((n) => [n, 1]))
  let total = 0
  const emit = ([name, a, b]) => {
    if (!armed.has(name)) return
    for (let j = 0; j < 6; j += 2) total += a * (j + 1) - b
    for (let j = 1; j < 6; j += 2) total += armed.get(name) * (a * (j + 1) - b)
    armed.set(name, 0)
  }
  const half = events.length >> 1
  for (let i = 0; i < half; i++) emit(events[i])
  for (const n of names) armed.set(n, armed.get(n) + 1)
  for (let i = half; i < events.length; i++) emit(events[i])
  return total
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.strictEqual(outputs[i], expected, `fixture ${i}: listener total`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
