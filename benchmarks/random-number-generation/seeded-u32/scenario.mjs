import { strict as assert } from 'node:assert'
const counts = [64, 128, 256, 512]
const seeds = [0, 1, 4294967295, 2, 42, 12345]
for (let i = 6; i < 36; i++) seeds.push((Math.imul(i, 2654435761) ^ Math.imul(i + 7, 40503)) >>> 0)
export const cases = seeds.map((seed, i) => ({ input: { seed, count: counts[i % 4] } }))
for (let i = 0; i < 4; i++) cases.push({ input: { ...cases[i].input } })
const key = (list) => list.join(',')
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const ones = new Array(32).fill(0)
  let total = 0, sum = 0
  const seen = new Set()
  for (const [i, { input }] of cases.entries()) {
    const list = outputs[i]
    assert.ok(Array.isArray(list) || ArrayBuffer.isView(list), `fixture ${i}: list required`)
    assert.equal(list.length, input.count, `fixture ${i}: wrong length`)
    for (const v of list) {
      assert.ok(Number.isInteger(v) && v >= 0 && v <= 4294967295, `fixture ${i}: ${v} is not an unsigned 32-bit integer`)
      for (let b = 0; b < 32; b++) ones[b] += (v >>> b) & 1
      sum += v
      total++
    }
    assert.ok(new Set(list).size >= input.count * 0.95, `fixture ${i}: too many repeated values`)
    const text = key(list)
    if (i < 36) { assert.ok(!seen.has(text), `fixture ${i}: same output as another seed`); seen.add(text) }
    else assert.equal(text, key(outputs[i - 36]), `fixture ${i}: same seed must give the same list`)
  }
  assert.ok(Math.abs(sum / total / 4294967296 - 0.5) < 0.02, 'mean is not near the middle of the range')
  ones.forEach((n, b) => assert.ok(Math.abs(n / total - 0.5) < 0.03, `bit ${b} is biased`))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
