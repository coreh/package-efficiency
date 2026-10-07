import { strict as assert } from 'node:assert'
// Deterministic digit generator (linear congruential), no Math.random.
let seed = 123456789
const next = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed >>> 8 }
const digits = (len) => {
  let s = String(1 + (next() % 9))
  while (s.length < len) s += String(next() % 10)
  return s
}
const pairs = []
const sizes = [[12, 6], [20, 10], [30, 15], [40, 19], [60, 25], [80, 40], [100, 50], [120, 30], [150, 75], [200, 100], [250, 60], [300, 150], [400, 200], [500, 250], [500, 20], [600, 300], [700, 100], [800, 400], [900, 450], [1000, 500], [1000, 90], [1200, 600], [1400, 700], [1500, 300], [1800, 900], [1800, 1200], [1800, 1790], [64, 63], [128, 64], [256, 128], [512, 256], [333, 111], [777, 222], [1024, 512], [1500, 1000], [900, 17], [450, 449], [200, 1], [1000, 800], [1600, 40]]
for (const [la, lb] of sizes) pairs.push([digits(la), digits(lb)])
pairs[8][1] = '1'
pairs[15][1] = '1' + '0'.repeat(40)
pairs[26][1] = '25' + '0'.repeat(30)
const oracle = ([a, b]) => { const x = BigInt(a), y = BigInt(b); return [String(x * y), String(x / y), String(x % y)] }
export const cases = pairs.map((input) => ({ input, expected: oracle(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 3, `fixture ${i}: three strings required`)
    for (let k = 0; k < 3; k++) {
      assert.equal(typeof out[k], 'string', `fixture ${i}[${k}]: string required`)
      assert.equal(out[k], expected[k], `fixture ${i}[${k}]`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length
