import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: node:crypto SHA-256 over the UTF-8 bytes. node:crypto is also one
// of the entries, so the reference is anchored by the two published
// known-answer vectors below ("" and "abc").
const reference = (s) => Array.from(createHash('sha256').update(s, 'utf8').digest())
assert.equal(createHash('sha256').update('').digest('hex'), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
assert.equal(createHash('sha256').update('abc').digest('hex'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve', '😀 ok', 'request', 'user', 'session']
const unit = (i) => [
  (j) => `${words[(i + j) % words.length]}-${j} `,
  (j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO user=${i * 31 + j} path=/api/v1/items/${j} status=${200 + (j % 5)}\n`,
  (j) => JSON.stringify({ id: i * 1000 + j, name: words[(i + j) % words.length], tags: ['a', 'b', j], ok: j % 2 === 0 }),
  (j) => `${words[(i * 7 + j) % words.length]} éè 日本 ${j} `,
][i % 4]
const make = (i, length) => {
  const make1 = unit(i)
  let s = ''
  for (let j = 0; s.length < length; j++) s += make1(j)
  return s.slice(0, length).replace(/[\ud800-\udbff]$/, '')
}
const lengths = [0, 1, 2, 3, 15, 31, 54, 55, 56, 57, 63, 64, 65, 66, 100, 119, 120, 127, 128, 129, 200, 255, 256, 300, 500, 511, 512, 700, 1000, 1023, 1024, 1500, 2000, 2048, 3000, 4000, 4096, 5000, 6000, 8000, 8192, 10000, 12000, 14000, 16000, 16384, 64, 64]
export const cases = lengths.map((length, i) => {
  const input = make(i, length)
  return { input, expected: reference(input) }
})
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  assert.fail('digest bytes required')
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.deepStrictEqual(bytesOf(outputs[i]), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.byteLength
