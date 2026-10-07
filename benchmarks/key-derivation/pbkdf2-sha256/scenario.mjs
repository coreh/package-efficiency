import { strict as assert } from 'node:assert'
import { pbkdf2Sync } from 'node:crypto'
// Reference: node:crypto pbkdf2Sync. node:crypto is also an entry, so the
// reference is anchored by a published known-answer vector below.
assert.equal(pbkdf2Sync('password', 'salt', 1, 20, 'sha256').toString('hex'), '120fb6cffcf8b32c43e7225256c4f837a86548c9')
assert.equal(pbkdf2Sync('password', 'salt', 4096, 20, 'sha256').toString('hex'), 'c5e478d59288c841aa530db6845c4c8d962893a0')
const reference = ({ password, salt, iterations, length }) => Array.from(pbkdf2Sync(password, salt, iterations, length, 'sha256'))
const words = ['correct', 'horse', 'battery', 'staple', 'café', '日本語', 'São Paulo', 'naïve', '😀', 'Tr0ub4dor', 'hunter2', 'letmein']
const hex = (i, n) => { let s = ''; for (let j = 0; s.length < n; j++) s += ((i * 2654435761 + j * 40503) >>> 0).toString(16).padStart(8, '0'); return s.slice(0, n) }
const lengths = [16, 32, 64]
export const cases = Array.from({ length: 36 }, (_, i) => {
  const password = i % 12 === 0 ? ''
    : i % 3 === 0 ? [0, 1, 2, 3].map((j) => words[(i + j * 5) % words.length]).join(' ')
    : i % 3 === 1 ? `${words[i % words.length]}${i * 17}!${words[(i * 3) % words.length]}`
    : `P@ss-${hex(i, 6 + (i % 20))}`
  const salt = i % 4 === 0 ? hex(i, 32) : i % 4 === 1 ? `user${i}@example.com` : i % 4 === 2 ? `${words[(i + 2) % words.length]}-salt-${hex(i + 1, 8)}` : hex(i, 8 + (i % 13) * 6)
  const input = { password, salt, iterations: 10000, length: lengths[i % 3] }
  return { input, expected: reference(input) }
})
const bytesOf = (x) => {
  if (x instanceof ArrayBuffer) return Array.from(new Uint8Array(x))
  if (ArrayBuffer.isView(x)) return Array.from(new Uint8Array(x.buffer, x.byteOffset, x.byteLength))
  if (Array.isArray(x)) return x
  if (x && x.type === 'Buffer' && Array.isArray(x.data)) return x.data
  assert.fail('key bytes required')
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const seen = new Set()
  for (const [i, { expected }] of cases.entries()) {
    assert.deepStrictEqual(bytesOf(outputs[i]), expected, `fixture ${i}`)
    seen.add(expected.join(','))
  }
  assert.equal(seen.size, cases.length, 'derived keys must all differ')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.byteLength
