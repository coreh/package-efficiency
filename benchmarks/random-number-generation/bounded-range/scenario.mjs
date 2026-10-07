import { strict as assert } from 'node:assert'
const counts = [1024, 2048, 4096]
const ranges = [
  [1, 6], [0, 9], [1, 100], [-50, 50], [0, 255], [0, 999],
  [1, 1000], [0, 65535], [-32768, 32767], [0, 1000000],
  [1, 1000000007], [0, 2147483646],
]
const seeds = [0, 1, 4294967295, 2, 42, 12345]
for (let i = 6; i < 36; i++) seeds.push((Math.imul(i, 2654435761) ^ Math.imul(i + 7, 40503)) >>> 0)
export const cases = seeds.map((seed, i) => {
  const [min, max] = ranges[i % 12]
  return { input: { seed, count: counts[i % 3], min, max } }
})
for (let i = 0; i < 4; i++) cases.push({ input: { ...cases[i].input } })
const key = (list) => list.join(',')
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const seen = new Set()
  for (const [i, { input }] of cases.entries()) {
    const { count, min, max } = input
    const list = outputs[i]
    assert.ok(Array.isArray(list) || ArrayBuffer.isView(list), `fixture ${i}: list required`)
    assert.equal(list.length, count, `fixture ${i}: wrong length`)
    const span = max - min + 1
    const bins = new Array(8).fill(0)
    const values = new Set()
    for (const v of list) {
      assert.ok(Number.isInteger(v) && v >= min && v <= max, `fixture ${i}: ${v} is outside ${min}..${max}`)
      bins[Math.min(7, Math.floor(((v - min) * 8) / span))]++
      if (span <= 100) values.add(v)
    }
    for (let b = 0; b < 8; b++) {
      const size = Math.ceil(((b + 1) * span) / 8) - Math.ceil((b * span) / 8)
      const expected = (count * size) / span
      assert.ok(Math.abs(bins[b] - expected) <= 0.4 * expected + 1, `fixture ${i}: slice ${b} has ${bins[b]}, expected about ${expected}`)
    }
    if (span <= 100) {
      assert.ok(values.has(min) && values.has(max), `fixture ${i}: an endpoint never occurs`)
      if (span <= 10) assert.equal(values.size, span, `fixture ${i}: some value never occurs`)
    }
    const text = key(list)
    if (i < 36) { assert.ok(!seen.has(text), `fixture ${i}: same output as another case`); seen.add(text) }
    else assert.equal(text, key(outputs[i - 36]), `fixture ${i}: same input must give the same list`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
