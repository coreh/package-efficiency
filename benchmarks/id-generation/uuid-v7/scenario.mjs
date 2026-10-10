import { strict as assert } from 'node:assert'
import { randomBytes } from 'node:crypto'
import { Buffer } from 'node:buffer'
// The input is how many IDs one call generates. Every fixture asks for 100:
// generating an ID takes no other input.
export const COUNT = 100
export const cases = Array.from({ length: 16 }, () => ({ input: COUNT }))

// RFC 9562 version 7: 48-bit Unix time in milliseconds, version nibble 7,
// variant 10xx (8, 9, a or b), the rest free for counters and random bits.
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Every call happens after this module is loaded (the measuring script loads
// it before it starts any adapter, and a JavaScript runner before it calls
// verify) and before its outputs are verified, so each timestamp lies between
// the two. The slack absorbs clock reads in other processes and a generator
// that advances its timestamp when its counter overflows.
const loadedAt = Date.now()
const SLACK_MS = 1000
const timestamp = (id) => parseInt(id.slice(0, 8) + id.slice(9, 13), 16)
// The low 32 bits (the last 8 hex digits) are random in every layout RFC 9562
// allows: a counter sits in rand_a and the top of rand_b, never at the bottom.
// Across 100 random values each of those bits is 0 somewhere and 1 somewhere
// (a fixed bit by chance has probability 2^-99); a constant, a counter or a
// hash of the time has bits that never change.
const low32 = (id) => parseInt(id.slice(28), 16) >>> 0

export const verifyOne = (i, output, now = Date.now()) => {
  assert.ok(Array.isArray(output), `fixture ${i}: a list of ${COUNT} UUID strings is required`)
  assert.equal(output.length, COUNT, `fixture ${i}: ${COUNT} IDs are required`)
  let anyOne = 0, allOne = 0xffffffff
  for (const [k, id] of output.entries()) {
    assert.equal(typeof id, 'string', `fixture ${i}, ID ${k}: a string is required`)
    assert.match(id, V7, `fixture ${i}, ID ${k}: ${id} is not a UUID v7 in canonical form`)
    const ms = timestamp(id)
    assert.ok(ms >= loadedAt - SLACK_MS && ms <= now + SLACK_MS,
      `fixture ${i}, ID ${k}: timestamp ${new Date(ms).toISOString()} is outside the time of the call (${new Date(loadedAt).toISOString()} to ${new Date(now).toISOString()})`)
    const bits = low32(id)
    anyOne = (anyOne | bits) >>> 0
    allOne = (allOne & bits) >>> 0
  }
  assert.ok(anyOne === 0xffffffff && allOne === 0, `fixture ${i}: the low 32 bits are not random (a bit never changes across the batch)`)
}
export const verifyResults = (outputs) => {
  const now = Date.now()
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i], now)
  const all = outputs.flat().map((id) => id.toLowerCase())
  assert.equal(new Set(all).size, all.length, 'IDs must be unique across every call')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check must refuse what is not the job. A reference batch, built here
// from the clock and random bytes, passes; each altered batch fails.
const hex = (bytes) => Buffer.from(bytes).toString('hex')
const format = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
const reference = (ms = Date.now(), version = 7) => Array.from({ length: COUNT }, () => {
  const b = randomBytes(16)
  b.writeUIntBE(ms, 0, 6)
  b[6] = (version << 4) | (b[6] & 0x0f)
  b[8] = 0x80 | (b[8] & 0x3f)
  return format(hex(b))
})
verifyOne(0, reference())
verifyOne(0, reference().map((id) => id.toUpperCase()))
const proofs = {
  'version 4': reference(Date.now(), 4),
  'a fixed old timestamp': reference(Date.UTC(2024, 0, 1)),
  'a timestamp in seconds': reference(Math.floor(Date.now() / 1000)),
  'a timestamp in units of 1/4096 s (the pre-RFC draft layout)': reference(Math.floor(Date.now() * 4.096)),
  'variant 0xxx': reference().map((id) => id.slice(0, 19) + '4' + id.slice(20)),
  'a counter in the low bits': reference().map((id, k) => id.slice(0, 28) + (0x1234 + k).toString(16).padStart(8, '0')),
  'one ID repeated': Array(COUNT).fill(reference()[0]),
  'too few IDs': reference().slice(1),
  'no hyphens': reference().map((id) => id.replaceAll('-', '')),
  'braces': reference().map((id) => `{${id}}`),
}
for (const [what, batch] of Object.entries(proofs)) assert.throws(() => verifyOne(0, batch), undefined, `the check accepts ${what}`)
{
  const batch = reference()
  assert.throws(() => verifyResults(cases.map(() => batch)), /unique/, 'the check accepts the same batch twice')
}
