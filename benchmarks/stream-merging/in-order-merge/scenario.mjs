import { strict as assert } from 'node:assert'
// Source s, chunk c: SIZE bytes, each a deterministic function of (s, c, offset).
export const SIZE = 1024
export const cases = [
  { input: { sources: 10, chunks: 64, size: SIZE }, expected: { chunks: 640 } },
  { input: { sources: 100, chunks: 16, size: SIZE }, expected: { chunks: 1600 } },
  { input: { sources: 100, chunks: 32, size: SIZE }, expected: { chunks: 3200 } },
]
const expectedBytes = ({ sources, chunks, size }) => {
  const out = Buffer.allocUnsafe(sources * chunks * size)
  let at = 0
  for (let s = 0; s < sources; s++) for (let c = 0; c < chunks; c++) for (let j = 0; j < size; j++) out[at++] = (s * 31 + c * 7 + j * 3) & 255
  return out
}
// The merged stream may re-cut chunks, so the check compares the bytes in order.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(Array.isArray(output) && output.length > 0, `fixture ${i}: the output must be the list of chunks read`)
    for (const chunk of output) assert.ok(chunk instanceof Uint8Array, `fixture ${i}: every chunk must be bytes`)
    const got = Buffer.concat(output)
    const want = expectedBytes(input)
    assert.strictEqual(got.length, want.length, `fixture ${i}: total bytes`)
    assert.ok(got.equals(want), `fixture ${i}: the bytes of the sources, in source order`)
  }
}
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (output) => output.length
