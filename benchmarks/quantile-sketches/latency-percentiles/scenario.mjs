import { strict as assert } from 'node:assert'
const N = 20000
let seed = 12345
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296 }
const normal = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd())
const shapes = [
  (s) => Math.exp(Math.log(2000) + s * normal()),
  (s) => rnd() < 0.9 ? 800 + 400 * rnd() : Math.exp(Math.log(30000) + s * normal()),
  (s) => 1000 + 99000 * rnd() * (s / 2),
  (s) => 500 / Math.pow(rnd(), s / 2),
  () => 4200,
  (s) => Math.exp(Math.log(90) + s * normal()),
  (s) => Math.exp(Math.log(2500000) + s * normal()),
]
const make = (i) => {
  const s = 0.3 + (i % 4) * 0.35
  const f = shapes[i % shapes.length]
  return Array.from({ length: N }, () => Math.max(1, Math.min(9000000000, Math.round(f(s)))))
}
const quantiles = [0.5, 0.9, 0.99, 0.999]
const expectedBounds = (samples) => {
  const sorted = [...samples].sort((a, b) => a - b)
  return quantiles.map((q) => {
    const r = q * (sorted.length - 1)
    return [sorted[Math.max(0, Math.floor(r) - 2)] * 0.98, sorted[Math.min(sorted.length - 1, Math.ceil(r) + 2)] * 1.02]
  })
}
export const cases = Array.from({ length: 24 }, (_, i) => { const input = make(i); return { input, expected: expectedBounds(input) } })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 4, `fixture ${i}: four percentiles required`)
    out.forEach((v, k) => {
      assert.ok(typeof v === 'number' && Number.isFinite(v), `fixture ${i}: finite numbers required`)
      assert.ok(v >= expected[k][0] && v <= expected[k][1], `fixture ${i} q${quantiles[k]}: ${v} outside [${expected[k][0]}, ${expected[k][1]}]`)
      if (k) assert.ok(v >= out[k - 1], `fixture ${i}: percentiles must not decrease`)
    })
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
