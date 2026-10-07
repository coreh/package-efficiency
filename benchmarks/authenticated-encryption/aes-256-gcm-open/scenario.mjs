import { strict as assert } from 'node:assert'
import { createCipheriv } from 'node:crypto'
const seal = ({ key, nonce, aad, text }) => {
  const c = createCipheriv('aes-256-gcm', Buffer.from(key), Buffer.from(nonce))
  c.setAAD(Buffer.from(aad))
  return Buffer.concat([c.update(text, 'utf8'), c.final(), c.getAuthTag()])
}
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `Pedido ${j}: café com leite, 日本語, 😀 total R$ ${(i + j) * 3},50`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
]
const sizes = [0, 1, 15, 16, 17, 31, 32, 63, 64, 100, 128, 200, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4096]
const message = (i, size) => {
  let s = ''
  for (let j = 0; s.length < size; j++) s += lines[(i + j) % lines.length](i, j) + '\n'
  s = s.slice(0, size)
  return /[\ud800-\udbff]$/.test(s) ? s.slice(0, -1) : s
}
const ascii = (seed, n) => Array.from({ length: n }, (_, k) => String.fromCharCode(33 + ((seed * 31 + k * 17 + (k >> 2) * seed) % 94))).join('')
// "sealed" is ciphertext followed by the 16-byte tag, one character per byte (code points 0-255).
export const cases = Array.from({ length: 48 }, (_, i) => {
  const size = i < sizes.length ? sizes[i] : [1024, 1200, 2048, 4096, 6000, 8192][i % 6] + i
  const text = message(i, size)
  const base = { key: ascii(i + 1, 32), nonce: ascii(i + 101, 12), aad: `msg:${i}:v1`, text }
  const sealed = seal(base).toString('latin1')
  return { input: { key: base.key, nonce: base.nonce, aad: base.aad, sealed }, expected: Buffer.from(text, 'utf8').toString('hex') }
})
const hex = (v) => Buffer.from(v).toString('hex')
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: encoded bytes required`)
    assert.ok(out === expected || out === Buffer.from(expected, 'hex').toString('base64'), `fixture ${i}: plaintext differs`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => {
  const out = operation(input)
  assert.ok(out instanceof Uint8Array, 'a byte array is required')
  return hex(out)
}))
export const consume = (result) => result.length
