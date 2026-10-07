import { strict as assert } from 'node:assert'
import { createHmac } from 'node:crypto'
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
  (i, j) => `POST /webhook/${i}/${j} sig-input ts=${1790000000 + i * 60 + j} body={"amount":${(i + 1) * j},"cur":"BRL"}`,
]
const message = (i, size) => {
  let s = ''
  for (let j = 0; s.length < size; j++) s += lines[(i + j) % lines.length](i, j) + '\n'
  return s.slice(0, size)
}
const ascii = (seed, n) => Array.from({ length: n }, (_, k) => String.fromCharCode(33 + ((seed * 31 + k * 17 + (k >> 2) * seed) % 94))).join('')
const small = [16, 32, 48, 64, 100, 128, 200, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4096, 5000, 6000, 8192, 10000, 12000]
const sizes = [...small, ...small.map((n) => n + 7).slice(0, 18), 16384, 14000, 9000, 7000, 3500, 1800].slice(0, 48)
const keyLengths = [32, 16, 64, 100]
const hmac = ({ key, text }) => createHmac('sha256', key).update(text, 'utf8').digest('hex')
export const cases = sizes.map((size, i) => {
  const input = { key: ascii(i + 1, keyLengths[i % 4]), text: message(i, size) }
  return { input, expected: hmac(input) }
})
const toHex = (v) => Array.isArray(v) ? Buffer.from(v).toString('hex') : v
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const seen = new Set()
  for (const [i, { expected }] of cases.entries()) {
    const out = toHex(outputs[i])
    assert.equal(typeof out, 'string', `fixture ${i}: tag bytes required`)
    assert.equal(out, expected, `fixture ${i}: tag differs`)
    seen.add(out)
  }
  assert.equal(seen.size, cases.length, 'tags must differ between fixtures')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => {
  const out = operation(input)
  assert.ok(out instanceof Uint8Array, 'a byte array is required')
  assert.equal(out.length, 32, 'tag must be 32 bytes')
  return Buffer.from(out).toString('hex')
}))
export const consume = (result) => result.length
