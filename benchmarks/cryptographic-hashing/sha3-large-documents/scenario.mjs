import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: node:crypto SHA3-256 over the UTF-8 bytes, anchored by the
// published known-answer vectors for "" and "abc" below.
const reference = (s) => Array.from(createHash('sha3-256').update(s, 'utf8').digest())
assert.equal(createHash('sha3-256').update('').digest('hex'), 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a')
assert.equal(createHash('sha3-256').update('abc').digest('hex'), '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532')
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve', '😀 ok', 'request', 'user', 'session']
const unit = (i) => [
  (j) => `${words[(i + j) % words.length]}-${j} lorem ipsum dolor sit amet, `,
  (j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO user=${i * 31 + j} path=/api/v1/items/${j} status=${200 + (j % 5)}\n`,
  (j) => JSON.stringify({ id: i * 100000 + j, name: words[(i + j) % words.length], tags: ['a', 'b', j], ok: j % 2 === 0 }) + ',',
  (j) => `${j},${words[(i * 7 + j) % words.length]},${(j * 37 % 1000) / 10},"éè 日本 ${j}"\n`,
][i % 4]
const make = (i, length) => {
  const make1 = unit(i)
  const parts = []
  let n = 0
  for (let j = 0; n < length; j++) { const p = make1(j); parts.push(p); n += p.length }
  return parts.join('').slice(0, length).replace(/[\ud800-\udbff]$/, '')
}
const kb = 1024
const lengths = [32, 40, 48, 64, 80, 96, 128, 160, 192, 256, 300, 384, 512, 640, 768, 1000, 1024, 32, 48, 64, 100, 136, 200, 250, 350, 450, 550, 700, 850, 900, 60, 90, 120, 180, 220, 320].map((n) => n * kb)
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
