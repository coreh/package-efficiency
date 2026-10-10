import { strict as assert } from 'node:assert'
import { createHash } from 'node:crypto'
// Reference: node:crypto MD5 over the UTF-8 bytes. node:crypto is also one of
// the entries, so the reference is anchored by the seven test-suite vectors of
// RFC 1321, appendix A.5, checked here first.
const md5 = (s) => createHash('md5').update(s, 'utf8').digest()
const reference = (s) => Array.from(md5(s))
const rfc1321 = [
  ['', 'd41d8cd98f00b204e9800998ecf8427e'],
  ['a', '0cc175b9c0f1b6a831c399e269772661'],
  ['abc', '900150983cd24fb0d6963f7d28e17f72'],
  ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
  ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
  ['ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 'd174ab98d277d9f5a5611c2c9f419d9f'],
  ['12345678901234567890123456789012345678901234567890123456789012345678901234567890', '57edf4a22be3c955ac49da2e2107b67a'],
]
for (const [s, hex] of rfc1321) assert.equal(md5(s).toString('hex'), hex, `RFC 1321 vector ${JSON.stringify(s)}`)
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve', '😀 ok', 'request', 'user', 'session']
const unit = (i) => [
  (j) => `${words[(i + j) % words.length]}-${j} `,
  (j) => `2026-10-09T08:${String(j % 60).padStart(2, '0')}:00Z GET /static/app.${i}.${j}.js etag="${j * 17 + i}" bytes=${1000 + j * 13}\n`,
  (j) => JSON.stringify({ key: `cache:${i}:${j}`, name: words[(i + j) % words.length], parts: [j, 'x', i], fresh: j % 3 === 0 }),
  (j) => `${words[(i * 5 + j) % words.length]} ñü 中文 ${j} `,
][i % 4]
const make = (i, length) => {
  const make1 = unit(i)
  let s = ''
  for (let j = 0; s.length < length; j++) s += make1(j)
  return s.slice(0, length).replace(/[\ud800-\udbff]$/, '')
}
const lengths = [0, 1, 2, 3, 15, 31, 54, 55, 56, 57, 63, 64, 65, 66, 100, 119, 120, 127, 128, 129, 200, 255, 256, 300, 500, 511, 512, 700, 1000, 1023, 1024, 1500, 2048, 3000, 4096, 6000, 8192, 12000, 14000, 16000, 16384]
const inputs = [...lengths.map((length, i) => make(i, length)), ...rfc1321.map(([s]) => s)]
export const cases = inputs.map((input) => ({ input, expected: reference(input) }))
assert.equal(cases.length, 48)
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  assert.fail('digest bytes required')
}
export const verifyOne = (i, output) => {
  assert.deepStrictEqual(bytesOf(output), cases[i].expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.byteLength
// The check refuses outputs that did not do the job.
const right = cases.map(({ input }) => md5(input))
verifyResults(right)
verifyResults(cases.map(({ input }) => Array.from(md5(input))))
const wrong = {
  'the input unchanged': cases.map(({ input }) => input),
  'the input as bytes': cases.map(({ input }) => new TextEncoder().encode(input)),
  'a constant digest': cases.map(() => md5('')),
  "another fixture's digest": right.map((_, i) => right[(i + 1) % right.length]),
  'the hex string': cases.map(({ input }) => md5(input).toString('hex')),
  'SHA-1 truncated to 16 bytes': cases.map(({ input }) => createHash('sha1').update(input).digest().subarray(0, 16)),
  'MD5 of the UTF-16 code units': cases.map(({ input }) => createHash('md5').update(input, 'utf16le').digest()),
  'MD5 of the Latin-1 truncated bytes': cases.map(({ input }) => createHash('md5').update(input, 'latin1').digest()),
  'the first 15 bytes': right.map((d) => d.subarray(0, 15)),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
