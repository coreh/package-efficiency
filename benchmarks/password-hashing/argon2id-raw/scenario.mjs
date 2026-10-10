import { strict as assert } from 'node:assert'
import * as crypto from 'node:crypto'
// Parameters: Argon2id, version 0x13, m = 19456 KiB (19 MiB), t = 2, p = 1,
// a 32-byte tag, no secret and no associated data.
const params = { memory: 19456, passes: 2, parallelism: 1, length: 32 }
// RFC 9106 section 5.3 (Argon2id, m=32 KiB, t=3, p=4, with a secret and
// associated data). It anchors node:crypto, which recorded the expected values
// below; it is checked only where the runtime has argon2Sync (Node 24.7+, Bun).
const rfc9106 = '0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659'
if (typeof crypto.argon2Sync === 'function') {
  const tag = crypto.argon2Sync('argon2id', { message: Buffer.alloc(32, 1), nonce: Buffer.alloc(16, 2), secret: Buffer.alloc(8, 3), associatedData: Buffer.alloc(12, 4), parallelism: 4, tagLength: 32, memory: 32, passes: 3 })
  assert.equal(Buffer.from(tag).toString('hex'), rfc9106)
}
// Salts: 16 bytes of xorshift32 noise per fixture. Fixture 10 reuses fixture
// 0's salt with a password that differs only in case; fixture 9 repeats
// fixture 0's password with another salt.
const salt = (i) => {
  const out = Buffer.alloc(16)
  let x = ((i + 1) * 2654435761) >>> 0 || 1
  for (let k = 0; k < 16; k++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[k] = x & 0xff }
  return out.toString('hex')
}
const passwords = ['password', '', 'correct horse battery staple', 'café au lait', '日本語のパスワード', '😀🔐 emoji pass', 'tab\tand space ', 'nul\u0000inside', 'a'.repeat(128), 'password', 'Password']
// Expected tags, recorded once from two independent implementations that
// agreed on every fixture: node:crypto argon2Sync (OpenSSL 3.5's Argon2) and
// @noble/hashes 2.4.0 argon2id (pure JavaScript). Both also reproduce the
// RFC 9106 vector above.
const tags = [
  'cf808d374ce25a6cb1888cd06d63df1da876e97607bfc0b69a75ca15149edd09',
  '8e3a3d9e7879f4ad0cbc51fce93d496924231a237e6f609f6712cd09957524be',
  '0662e65202ba70dc7de8dff7cc3dc575ee1785a57e731f2a7d1a19fb01affc9e',
  '1faa9864146ce3748ab79ab48a5f18c22d34b7f4091049d1e9f2f177d9711614',
  '18ed0da03e5942e833c3776feb82b55dec0d65497fa3ca6f9af48dcb8f896fdd',
  '07791984bb40d45f8d08d72823e65d2b15fb25cecd26a4ddbcd0d6709c8bac1a',
  'fb299e41dd22bd64c1058d1f57809631200538dfc6b6285ed3b5644e919bdc2f',
  '1a98256891fb09367379a1f7dbd6ed9a1e33212861d6ba127e20953bcff72407',
  'f5efcf1fed75c6c2e0b3cace123a578567d579847cccc07f59267397e51f9991',
  'c9a1131de5e36fc7e6e53816843d6a4e9634b518b6b25caba1999a52654b2d32',
  'd2a1260636f95e6cb06ad26aac88a76f0d11c2d8f9b41076327c3494d78ac893',
]
// An input is { password, salt, memory, passes, parallelism, length }: the
// password as text (encoded to UTF-8 inside the call), the salt as lowercase
// hex (each adapter's prepare turns it into bytes once, before any timing).
export const cases = passwords.map((password, i) => ({
  input: { password, salt: salt(i === 10 ? 0 : i), ...params },
  expected: Array.from(Buffer.from(tags[i], 'hex')),
}))
assert.equal(new Set(tags).size, tags.length)
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  // A Go []byte is marshalled by encoding/json as base64.
  if (typeof x === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(x)) return Array.from(Buffer.from(x, 'base64'))
  assert.fail('32 tag bytes required')
}
const verifyOne = (i, output) => assert.deepStrictEqual(bytesOf(output), cases[i].expected, `fixture ${i}`)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.byteLength ?? value.length
// Proofs that the check can fail: a tag with one bit flipped, a tag cut to 31
// bytes, another fixture's tag, the tag as hex text, and the tags of fixture 0
// recorded with the wrong variant (Argon2i, Argon2d), the old version 0x10,
// three passes instead of two, 19000 KiB instead of 19456, and a 64-byte tag.
const hex = (h) => Buffer.from(h, 'hex')
const flipped = [...cases[3].expected]; flipped[31] ^= 1
assert.throws(() => verifyOne(3, flipped), /fixture 3/)
assert.throws(() => verifyOne(3, cases[3].expected.slice(0, 31)), /fixture 3/)
assert.throws(() => verifyOne(10, cases[0].expected), /fixture 10/)
assert.throws(() => verifyOne(0, tags[0]))
for (const wrong of [
  '6ea7f76f32ec9a1650ff0c5cff92e821e4b6c9cb6649764718f7656ab395f6ba', // Argon2i
  'fd77966a74869c9e6ab7d43ae6d04eedffcef506c6fb1a46b2afddd69bf37b7e', // Argon2d
  '837fd1e487ccb4b0c773c5e1c5409b1e6576ad71fc5c33074c49c113ba8d9544', // version 0x10
  '251844f64e60826335bf64d5d3c06ee03682541b2ef6c26ec699ee4ad6a55242', // t = 3
  '04306d5ef7ac72647d33ff5ef891b8caac427fc17d0291f89b909e7aad2bdf65', // m = 19000
  '4ecf70633bfe633253af6b5b9897d7f7587cd16fe60bfca4f24738b0659c142025c53de128f6e9a40688d0d9ea3e3fc6f02ddc5f904dba1ff36849d6d33326ed', // 64 bytes
]) assert.throws(() => verifyOne(0, hex(wrong)), /fixture 0/)
// The base64 form a Go []byte takes is accepted only when it holds the tag.
verifyOne(0, hex(tags[0]).toString('base64'))
assert.throws(() => verifyOne(3, Buffer.from(flipped).toString('base64')), /fixture 3/)
