import { strict as assert } from 'node:assert'
import { createHmac } from 'node:crypto'

// Reference: RFC 4226 HOTP (HMAC-SHA-1, dynamic truncation, 6 digits) written
// with node:crypto, anchored by the published RFC 4226 and RFC 6238 vectors.
const hotp = (key, counter) => {
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const h = createHmac('sha1', key).update(msg).digest()
  const o = h[19] & 0xf
  const bin = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]
  return String(bin % 1000000).padStart(6, '0')
}
const totp = (key, time) => hotp(key, Math.floor(time / 30))

const rfcKey = Buffer.from('12345678901234567890')
const rfc4226 = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489']
rfc4226.forEach((code, i) => assert.equal(hotp(rfcKey, i), code))
// RFC 6238 Appendix B (SHA-1, 8 digits); the 6-digit code is its last 6 digits.
const rfc6238 = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']]
rfc6238.forEach(([t, code]) => assert.equal(totp(rfcKey, t), code.slice(2)))

const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const toBase32 = (buf) => {
  let bits = 0, value = 0, out = ''
  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) { out += b32[(value >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if (bits > 0) out += b32[(value << (5 - bits)) & 31]
  return out
}

let seed = 20261007
const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
const randomKey = () => Buffer.from(Array.from({ length: 20 }, () => Math.floor(rand() * 256)))

// Each case: [key, time, counter, offset of the candidate in steps, or null for a wrong code]
const specs = []
rfc6238.forEach(([t], i) => specs.push([rfcKey, t, i, [0, -1, 1, 2, null, -2][i]]))
for (let i = 6; i < 10; i++) specs.push([rfcKey, 1000000000 + i * 7919, i, [0, 1, -1, 0][i - 6]])
const offsets = [0, -1, 1, 0, -2, 2, null, 0, 1, -1, 3, 0]
for (let i = 10; i < 48; i++) {
  const key = randomKey()
  // boundaries: some times sit exactly on a step start or on its last second
  let time = 1500000000 + Math.floor(rand() * 400000000)
  if (i % 5 === 0) time -= time % 30
  if (i % 7 === 0) time = time - (time % 30) + 29
  const counter = i === 20 ? 2 ** 31 - 1 : Math.floor(rand() * 2 ** 31)
  specs.push([key, time, counter, offsets[i % offsets.length]])
}

export const cases = specs.map(([key, time, counter, offset]) => {
  const window = [-1, 0, 1].map((d) => totp(key, time + d * 30))
  let code, valid
  if (offset === null) {
    let n = (Number(window[1]) + 111111) % 1000000
    while (window.includes(String(n).padStart(6, '0'))) n = (n + 1) % 1000000
    code = String(n).padStart(6, '0')
    valid = false
  } else {
    code = totp(key, time + offset * 30)
    valid = Math.abs(offset) <= 1
    // a step outside the window must not collide with a code inside it
    if (!valid) assert.ok(!window.includes(code), 'fixture collision')
  }
  return {
    input: { secret: toBase32(key), time, counter, code },
    expected: [hotp(key, counter), window[1], valid],
  }
})
assert.ok(cases.some((c) => c.expected[2]) && cases.some((c) => !c.expected[2]))
assert.ok(cases.some((c) => c.expected[1].startsWith('0')) && cases.some((c) => c.expected[0].startsWith('0')))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 3, `fixture ${i}: [hotp, totp, valid] required`)
    assert.deepStrictEqual([String(out[0]), String(out[1]), out[2]], expected, `fixture ${i}`)
    assert.equal(typeof out[0], 'string', `fixture ${i}: codes are strings`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
