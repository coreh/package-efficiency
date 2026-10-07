import { strict as assert } from 'node:assert'
const f = Math.fround
const values = []
for (let i = 0; i < 8; i++) values.push(f(Number((9.99 + i * 37.31).toFixed(2))))          // prices
for (let i = 0; i < 6; i++) values.push(f(Number((-122.4194 + i * 1.234567).toFixed(6)))) // coordinates
for (let i = 0; i < 8; i++) values.push(f(Math.sin(i * 2.1 + 0.5) * 100))                 // sensor readings
for (let i = 0; i < 6; i++) values.push(f(Math.sqrt(3 * i + 2.5)))
for (let i = 0; i < 6; i++) values.push(f(1 / (i + 3)))
for (let i = 0; i < 4; i++) values.push(f(Math.exp(i * 7 - 12)))
values.push(f(0.1 + 0.2), f(4.35), f(0.000001), f(1.5e-7), 4194304.5, f(1.2345e25), f(2.5e30),
  1.401298464324817e-45, 1.1754943508222875e-38, 3.4028234663852886e38, -0.5, f(-3.14159), 0.5, 1.5, f(0.3), f(0.7))
// The same kinds of number many times over with different digits: 20,000 distinct
// f32 values, so no cache of recently formatted numbers can hold them.
const base = values.filter((v) => Math.abs(v) > 1e-6 && Math.abs(v) < 1e12)
let seed = 20261007
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296 }
const seen = new Set(values)
for (let n = 0; values.length < 20000; n++) {
  const v = f(Number((base[n % base.length] * (0.5 + rnd())).toPrecision(2 + (n % 8))))
  if (!Number.isFinite(v) || v === 0 || seen.has(v)) continue
  seen.add(v)
  values.push(v)
}
for (const v of values) assert.ok(Number.isFinite(v) && f(v) === v && !Object.is(v, -0))
export const cases = values.map((input) => ({ input }))
// Significant digits of a decimal spelling, trailing zeros removed.
const digitCount = (s) => {
  const m = /^-?(\d*)(?:\.(\d*))?(?:[eE][+-]?\d+)?$/.exec(s)
  assert.ok(m && (m[1] + (m[2] ?? '')).length > 0, `not a decimal number: ${s}`)
  return (m[1] + (m[2] ?? '')).replace(/^0+/, '').replace(/0+$/, '').length
}
// Fewest digits whose decimal value rounds to the same f32.
const shortest = (x) => { for (let p = 1; p <= 9; p++) if (f(Number(x.toPrecision(p))) === x) return p; return 9 }
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(f(Number(outputs[i])), input, `fixture ${i}: ${outputs[i]} does not read back as f32 ${input}`)
    assert.equal(digitCount(outputs[i]), shortest(input), `fixture ${i}: ${outputs[i]} is not the shortest f32 form of ${input}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
