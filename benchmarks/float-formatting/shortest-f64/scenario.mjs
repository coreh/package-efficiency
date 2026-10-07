import { strict as assert } from 'node:assert'
const values = []
for (let i = 0; i < 8; i++) values.push(Number((9.99 + i * 37.31).toFixed(2)))          // prices
for (let i = 0; i < 6; i++) values.push(Number((-122.4194 + i * 1.234567).toFixed(6)))  // coordinates
for (let i = 0; i < 8; i++) values.push(Math.sin(i * 2.1 + 0.5) * 100)                          // sensor readings
for (let i = 0; i < 6; i++) values.push(Math.sqrt(3 * i + 2.5))
for (let i = 0; i < 6; i++) values.push(1 / (i + 3))
for (let i = 0; i < 4; i++) values.push(Math.exp(i * 7 - 12))
values.push(0.1 + 0.2, 4.35, 0.000001, 1e-7, 1.5e-7, 123456789.12345678, 1e21, 1.2345e25, 2.5e300,
  5e-324, 2.2250738585072014e-308, 1.7976931348623157e308, -0.5, -3.14159, 0.5, 1.5)
// The same kinds of number, many times over with different digits: 20,000
// distinct values, so no runtime's cache of recently formatted numbers can
// hold them, and no branch pattern repeats within a batch. Generated values
// have 3 to 15 significant digits and moderate magnitudes, which every
// language's JSON reader converts to exactly the same double.
const base = values.filter((v) => Math.abs(v) > 1e-6 && Math.abs(v) < 1e15)
let seed = 20261006
const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed + 0.5) / 4294967296 }
const seen = new Set(values)
for (let n = 0; values.length < 20000; n++) {
  const v = Number((base[n % base.length] * (0.5 + rnd())).toPrecision(3 + (n % 13)))
  if (!Number.isFinite(v) || v === 0 || Number.isInteger(v) || seen.has(v)) continue
  seen.add(v)
  values.push(v)
}
for (const v of values) assert.ok(Number.isFinite(v) && !Object.is(v, -0) && (!Number.isInteger(v) || Math.abs(v) >= 1e21))
export const cases = values.map((input) => ({ input }))
// Sign, significant digits and decimal exponent of a decimal spelling.
const parts = (s) => {
  const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s)
  assert.ok(m && (m[2] + (m[3] ?? '')).length > 0, `not a decimal number: ${s}`)
  const frac = m[3] ?? ''
  let digits = m[2] + frac
  let exp = Number(m[4] ?? 0) - frac.length
  const lead = digits.match(/^0*/)[0].length
  digits = digits.slice(lead)
  const trail = digits.match(/0*$/)[0].length
  digits = digits.slice(0, digits.length - trail)
  if (digits === '') return `${m[1]}0`
  exp += trail
  return `${m[1]}${digits}e${exp}`
}
const digitCount = (s) => parts(s).replace(/^-/, '').split('e')[0].length
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(Number(outputs[i]), input, `fixture ${i}: ${outputs[i]} does not read back as ${input}`)
    // Shortest: as few significant digits as the reference. Which of several
    // equally short strings a package picks is not compared.
    assert.equal(digitCount(outputs[i]), digitCount(String(input)), `fixture ${i}: ${outputs[i]} is not the shortest form of ${input}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
