import { strict as assert } from 'node:assert'
import { createHash, createPrivateKey, createPublicKey, sign } from 'node:crypto'
const PKCS8 = Buffer.from('302e020100300506032b657004220420', 'hex')
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
const lengths = [0, 1, 2, 3, 15, 31, 32, 54, 55, 63, 64, 65, 100, 111, 112, 127, 128, 129, 200, 255, 256, 300, 500, 512, 700, 1000, 1024, 1500, 2000, 2048, 3000, 4000, 4096, 5000, 6000, 8000, 8192, 20, 40, 80, 160, 320, 640, 1280, 64, 64, 32, 5]
// Independent oracle: node:crypto. Ed25519 signatures are deterministic.
const toHex = (b) => Buffer.from(b).toString('hex')
export const cases = lengths.map((length, i) => {
  const seed = createHash('sha256').update(`ed25519-fixture-${i}`).digest()
  const key = createPrivateKey({ key: Buffer.concat([PKCS8, seed]), format: 'der', type: 'pkcs8' })
  const publicKey = Buffer.from(createPublicKey(key).export({ format: 'jwk' }).x, 'base64url')
  const message = make(i, length)
  return { input: { seed: toHex(seed), publicKey: toHex(publicKey), message }, expected: toHex(sign(null, Buffer.from(message, 'utf8'), key)) }
})
const hexOf = (x, i) => {
  if (typeof x === 'string') {
    if (/^[0-9a-f]{128}$/.test(x)) return x
    if (/^[A-Za-z0-9+/]{86}==$/.test(x)) return Buffer.from(x, 'base64').toString('hex')
    assert.fail(`fixture ${i}: hex or base64 signature required`)
  }
  if (x instanceof ArrayBuffer) return toHex(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return toHex(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x) && x.every((n) => Number.isInteger(n) && n >= 0 && n < 256)) return toHex(x)
  assert.fail(`fixture ${i}: signature bytes required`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.equal(hexOf(outputs[i], i), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
