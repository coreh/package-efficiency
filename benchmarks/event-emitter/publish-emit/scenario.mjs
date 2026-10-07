import { strict as assert } from 'node:assert'
// Deterministic pseudo-random numbers (a 32-bit LCG); no Math.random.
const rng = (seed) => { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296 }
const NAMES = ['connect', 'disconnect', 'message', 'error', 'data:chunk', 'data:end', 'user.login', 'tick']
const LISTENERS = 10
const REMOVED = [0, 5]
const shapes = {
  // Everything goes to one hot name.
  single: (n, r) => Math.floor(r() * 1),
  uniform: (n, r) => Math.floor(r() * (n + 1)),
  // Skewed: the first names get most traffic.
  skewed: (n, r) => Math.floor((n + 1) * r() ** 3),
  // Cycles through the names in order.
  cycle: (n, r, i) => i % (n + 1),
}
const nameCounts = [1, 2, 3, 5, 8, 8]
export const cases = Object.entries(shapes).flatMap(([, pick], s) =>
  nameCounts.map((count, c) => {
    const r = rng(7 + s * 31 + c)
    const length = 120 + ((s * 6 + c) * 17) % 121
    const names = NAMES.slice(0, count)
    // Index === count means an event nobody listens to.
    const events = Array.from({ length }, (_, i) => [pick(count, r, i) % (count + 1), Math.floor(r() * 2001) - 1000, Math.floor(r() * 2001) - 1000])
      .map(([k, a, b]) => [k === count ? 'unheard' : names[k % count], a, b])
    return { input: { names, events }, expected: reference({ names, events }) }
  }))
function reference({ names, events }) {
  const lists = new Map(names.map((n) => [n, Array.from({ length: LISTENERS }, (_, j) => j)]))
  let total = 0
  const emit = ([name, a, b]) => { for (const j of lists.get(name) ?? []) total += a * (j + 1) - b }
  const half = events.length >> 1
  for (let i = 0; i < half; i++) emit(events[i])
  for (const [n, l] of lists) lists.set(n, l.filter((j) => !REMOVED.includes(j)))
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
