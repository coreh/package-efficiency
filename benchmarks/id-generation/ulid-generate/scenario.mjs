import { strict as assert } from 'node:assert'
import { randomBytes, randomUUID } from 'node:crypto'
// The input is how many IDs one call generates. Every fixture asks for 100:
// generating an ID takes no other input.
export const COUNT = 100
export const cases = Array.from({ length: 16 }, () => ({ input: COUNT }))

// ULID (github.com/ulid/spec): 26 characters of Crockford's base32, the first
// 10 a 48-bit Unix time in milliseconds, the last 16 80 random bits. 26
// characters hold 130 bits, so the first is 0 to 7. Crockford's alphabet has
// no I, L, O or U, and decoding is case-insensitive.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ULID = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i
const value = (s) => {
  let n = 0
  for (const c of s.toUpperCase()) n = n * 32 + ALPHABET.indexOf(c)
  return n
}
// Every call happens after this module is loaded (the measuring script loads
// it before it starts any adapter, and a JavaScript runner before it calls
// verify) and before its outputs are verified, so each timestamp lies between
// the two. The slack absorbs clock reads in other processes.
const loadedAt = Date.now()
const SLACK_MS = 1000
const timestamp = (id) => value(id.slice(0, 10))
// The low 32 bits of the random part are random in every generator: a fresh
// draw per ID, or a monotonic generator's random increment added to the last
// value within a millisecond (the higher bits then stay put, so they are not
// checked). The last 7 characters hold 35 bits; the low 32 are taken. Across
// 100 random values each of those bits is 0 somewhere and 1 somewhere (a fixed
// bit by chance has probability 2^-99); a constant, a counter that adds 1 or
// a hash of the time has bits that never change.
const low32 = (id) => value(id.slice(19)) % 2 ** 32

export const verifyOne = (i, output, now = Date.now()) => {
  assert.ok(Array.isArray(output), `fixture ${i}: a list of ${COUNT} ULID strings is required`)
  assert.equal(output.length, COUNT, `fixture ${i}: ${COUNT} IDs are required`)
  let anyOne = 0, allOne = 0xffffffff
  for (const [k, id] of output.entries()) {
    assert.equal(typeof id, 'string', `fixture ${i}, ID ${k}: a string is required`)
    assert.match(id, ULID, `fixture ${i}, ID ${k}: ${id} is not a 26-character ULID in Crockford base32`)
    const ms = timestamp(id)
    assert.ok(ms >= loadedAt - SLACK_MS && ms <= now + SLACK_MS,
      `fixture ${i}, ID ${k}: timestamp ${ms} is outside the time of the call (${new Date(loadedAt).toISOString()} to ${new Date(now).toISOString()})`)
    const bits = low32(id)
    anyOne = (anyOne | bits) >>> 0
    allOne = (allOne & bits) >>> 0
  }
  assert.ok(anyOne === 0xffffffff && allOne === 0, `fixture ${i}: the low 32 random bits are not random (a bit never changes across the batch)`)
}
export const verifyResults = (outputs) => {
  const now = Date.now()
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i], now)
  const all = outputs.flat().map((id) => id.toUpperCase())
  assert.equal(new Set(all).size, all.length, 'IDs must be unique across every call')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check must refuse what is not the job. A reference batch, built here
// from the clock and random bytes, passes; each altered batch fails.
const encode = (n, length) => {
  let s = ''
  for (let k = 0; k < length; k++) { s = ALPHABET[n % 32] + s; n = Math.floor(n / 32) }
  return s
}
const randomPart = () => Array.from(randomBytes(16), (b) => ALPHABET[b & 31]).join('')
const reference = (ms = Date.now()) => Array.from({ length: COUNT }, () => encode(ms, 10) + randomPart())
verifyOne(0, reference())
verifyOne(0, reference().map((id) => id.toLowerCase()))
{
  // A monotonic generator: one random value, then random increments below 2^32.
  const ms = Date.now()
  let hi = value(randomPart().slice(0, 9)), lo = value(randomPart().slice(9))
  verifyOne(0, Array.from({ length: COUNT }, () => {
    lo += 1 + Math.floor(Math.random() * (2 ** 32 - 1))
    if (lo >= 2 ** 35) { lo -= 2 ** 35; hi += 1 }
    return encode(ms, 10) + encode(hi, 9) + encode(lo, 7)
  }))
}
const proofs = {
  'a fixed old timestamp': reference(Date.UTC(2024, 0, 1)),
  'a timestamp in seconds': reference(Math.floor(Date.now() / 1000)),
  'a timestamp in microseconds': reference(Date.now() * 1000),
  'a first character above 7': reference().map((id) => '8' + id.slice(1)),
  'the letter I': reference().map((id) => id.slice(0, 25) + 'I'),
  'the letter U': reference().map((id) => id.slice(0, 25) + 'U'),
  'a counter in the low bits': reference().map((id, k) => id.slice(0, 19) + encode(0x1234 + k, 7)),
  'one ID repeated': Array(COUNT).fill(reference()[0]),
  'too few IDs': reference().slice(1),
  '27 characters': reference().map((id) => id + '0'),
  'a hyphen': reference().map((id) => id.slice(0, 10) + '-' + id.slice(10)),
  'a UUID': Array.from({ length: COUNT }, () => randomUUID()),
}
for (const [what, batch] of Object.entries(proofs)) assert.throws(() => verifyOne(0, batch), undefined, `the check accepts ${what}`)
{
  const batch = reference()
  assert.throws(() => verifyResults(cases.map(() => batch)), /unique/, 'the check accepts the same batch twice')
}
