import { strict as assert } from 'node:assert'
import { createCipheriv } from 'node:crypto'
const encrypt = ({ key, iv, text }) => {
  const c = createCipheriv('aes-256-ctr', Buffer.from(key), Buffer.from(iv))
  return Buffer.concat([c.update(text, 'utf8'), c.final()])
}
// Known answer, so the oracle below is not only checked against itself: NIST SP 800-38A, F.5.5
// (CTR-AES256.Encrypt), first block.
{
  const c = createCipheriv('aes-256-ctr', Buffer.from('603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4', 'hex'), Buffer.from('f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff', 'hex'))
  const out = Buffer.concat([c.update(Buffer.from('6bc1bee22e409f96e93d7e117393172a', 'hex')), c.final()])
  assert.equal(out.toString('hex'), '601ec313775789a5b7a7f504bbf3d228', 'node:crypto AES-256-CTR does not match the NIST vector')
}
const lines = [
  (i, j) => `{"id":${i * 1000 + j},"user":"user${j % 97}@example.com","event":"login","ok":${j % 3 !== 0}}`,
  (i, j) => `2026-10-06T12:${String(j % 60).padStart(2, '0')}:00Z INFO request ${j} took ${(i * 7 + j) % 900}ms path=/api/v1/items/${j}`,
  (i, j) => `Pedido ${j}: café com leite, 日本語, 😀 total R$ ${(i + j) * 3},50`,
  (i, j) => `row ${j},${i},alpha,beta,${(i * j) % 1013},"quoted, text"`,
]
const sizes = [0, 1, 15, 16, 17, 31, 32, 33, 63, 64, 100, 128, 200, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4096]
const message = (i, size) => {
  let s = ''
  for (let j = 0; s.length < size; j++) s += lines[(i + j) % lines.length](i, j) + '\n'
  s = s.slice(0, size)
  return /[\ud800-\udbff]$/.test(s) ? s.slice(0, -1) : s
}
const ascii = (seed, n) => Array.from({ length: n }, (_, k) => String.fromCharCode(33 + ((seed * 31 + k * 17 + (k >> 2) * seed) % 94))).join('')
export const cases = Array.from({ length: 48 }, (_, i) => {
  const size = i < sizes.length ? sizes[i] : [1024, 1200, 2048, 4096, 6000, 8192][i % 6] + i
  const input = { key: ascii(i + 1, 32), iv: ascii(i + 101, 16), text: message(i, size) }
  // A few IVs end in two 0x7f bytes (the highest ASCII character), so in messages over 2 KB (129 blocks)
  // the counter carries out of its last byte.
  if (i % 8 === 7) input.iv = ascii(i + 101, 14) + '\u007f\u007f'
  return { input, expected: encrypt(input).toString('hex') }
})
const hex = (v) => Buffer.from(v).toString('hex')
const b64 = (v) => Buffer.from(v).toString('base64')
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: encoded bytes required`)
    assert.ok(out === expected || out === b64(Buffer.from(expected, 'hex')), `fixture ${i}: ciphertext differs`)
    assert.equal(Buffer.from(expected, 'hex').length, Buffer.byteLength(input.text), 'length')
  }
  assert.ok(cases.some(({ input }, i) => input.text.length > 100 && outputs[i] !== hex(Buffer.from(input.text))), 'output must not be the input')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => {
  const out = operation(input)
  assert.ok(out instanceof Uint8Array, 'a byte array is required')
  return hex(out)
}))
export const consume = (result) => result.length
