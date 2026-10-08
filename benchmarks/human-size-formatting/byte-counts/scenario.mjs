import { strict as assert } from 'node:assert'
// Deterministic sizes: exact powers, neighbours of powers, and an in-between
// ladder built from a fixed multiplicative sequence (no randomness).
const sizes = [0, 1, 7, 512, 1000, 1023, 1024, 1025, 1536, 2047]
for (let k = 2; k <= 5; k++) {
  const p = 1024 ** k
  sizes.push(p - 1, p, p + 1, Math.floor(p * 1.5), Math.floor(p * 7.77), 123 * 1024 ** (k - 1) + 456)
}
sizes.push(2 ** 40 * 3 + 12345, 2 ** 50, 2 ** 52 - 1)
let x = 1234567
while (sizes.length < 56) {
  x = (x * 48271) % 2147483647
  sizes.push(Math.floor(x / 2147483647 * 2 ** (10 + (sizes.length % 7) * 6)) + 1)
}
export const cases = sizes.map((input) => ({ input }))
// "bytes" in full is as good as "B".
const units = { '': 0, B: 0, BYTE: 0, BYTES: 0, K: 1, KB: 1, KIB: 1, M: 2, MB: 2, MIB: 2, G: 3, GB: 3, GIB: 3, T: 4, TB: 4, TIB: 4, P: 5, PB: 5, PIB: 5 }
const check = (n, out, i) => {
  assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
  const m = /^(\d+(?:\.\d+)?)\s?([A-Za-z]*)$/.exec(out)
  assert.ok(m, `fixture ${i}: unparsable ${JSON.stringify(out)}`)
  const k = units[m[2].toUpperCase()]
  assert.notEqual(k, undefined, `fixture ${i}: unknown unit in ${out}`)
  const num = Number(m[1])
  if (n < 1024) {
    assert.equal(k, 0, `fixture ${i}: ${out}`)
    assert.equal(num, n, `fixture ${i}: ${out}`)
    assert.ok(!m[1].includes('.') || /^\d+\.0+$/.test(m[1]), `fixture ${i}: ${out}`)
    return
  }
  let expectedK = 0
  while (expectedK < 5 && n >= 1024 ** (expectedK + 1)) expectedK++
  // A size just under a unit's boundary may round up to 1 of the next unit (1.0 PiB for 1024^5 - 1).
  const roundsUp = k === expectedK + 1 && num === 1 && n / 1024 ** k > 0.99
  assert.ok(k === expectedK || roundsUp, `fixture ${i}: unit of ${out}`)
  if (roundsUp) return
  assert.ok(num >= 1 && num <= 1024, `fixture ${i}: magnitude of ${out}`)
  const back = num * 1024 ** k
  assert.ok(Math.abs(back - n) <= n * 0.01, `fixture ${i}: ${out} is not ${n} bytes`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) check(input, outputs[i], i)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
