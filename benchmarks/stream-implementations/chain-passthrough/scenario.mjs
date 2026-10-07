import { strict as assert } from 'node:assert'
const SHAPES = [[200, 16384], [2000, 64]]
const DEPTHS = [1, 3, 8]
const MOD = 2147483647
// What the sink computes for a chunk, and the chunk the writer builds.
const chunkBytes = (i, size) => {
  const first = (i * 7 + 5) & 255, last = (i * 13 + 1) & 255, fill = i & 255
  return { first, mid: size === 1 ? first : (size >> 1) === 0 ? first : fill, last: size === 1 ? first : last }
}
export const cases = SHAPES.flatMap(([chunks, size]) => DEPTHS.map((depth) => {
  let checksum = 0
  for (let i = 0; i < chunks; i++) {
    const { first, mid, last } = chunkBytes(i, size)
    checksum = (checksum * 131 + size + first * 3 + mid * 5 + last * 7) % MOD
  }
  return { input: { chunks, size, depth }, expected: { bytes: chunks * size, count: chunks, checksum } }
}))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const o = outputs[i]
    assert.ok(o && typeof o === 'object', `fixture ${i}: output must be an object`)
    assert.strictEqual(o.count, expected.count, `fixture ${i}: chunks received`)
    assert.strictEqual(o.bytes, expected.bytes, `fixture ${i}: bytes received`)
    assert.strictEqual(o.checksum, expected.checksum, `fixture ${i}: checksum of the chunks in order`)
  }
}
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.count + output.bytes + output.checksum
