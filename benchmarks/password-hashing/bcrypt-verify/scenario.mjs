import { strict as assert } from 'node:assert'
const words = ['correct horse battery staple', 'hunter2', 'P@ssw0rd!', 'café au lait', '日本語のパスワード', 'пароль123', '😀🔐 emoji pass', 'tab\tand space ', 'x', 'The quick brown fox jumps over the lazy dog', 'Tr0ub4dor&3', 'ñandú-ñu-ñandú']
const tweak = (s, i) => [s + ' ', s.toUpperCase() === s ? s.toLowerCase() : s.toUpperCase(), s.slice(0, -1) + (s.endsWith('a') ? 'b' : 'a'), 'x' + s][i % 4]
const byteLength = (s) => Buffer.byteLength(s)
export const cases = Array.from({ length: 36 }, (_, i) => {
  const base = words[i % words.length]
  const password = i < words.length ? base : `${base}-${i * 7919}${i % 3 === 0 ? '!'.repeat(i % 12) : ''}`
  // Two candidates are checked against the hash of the password. Which of them
  // is the password changes from fixture to fixture, so no constant answer passes.
  const wrong = tweak(password, i), other = tweak(password, i + 1)
  const candidates = [[password, wrong], [wrong, password], [wrong, other], [password, password]][i % 4]
  return { input: [password, ...candidates] }
})
// Longest password bcrypt uses in full: 72 bytes. The wrong one differs in the last byte.
cases[35] = { input: ['a'.repeat(72), 'a'.repeat(72), 'a'.repeat(71) + 'b'] }
for (const c of cases) {
  const [password, first, second] = c.input
  c.expected = [first === password, second === password]
  for (const s of c.input) assert.ok(byteLength(s) <= 72 && !s.includes('\0'), 'bcrypt reads at most 72 bytes and stops at NUL')
}
// An output is [first matches, second matches, the hash that was made]. The
// hash is only there to show the work: cost 8, standard 60-character form, and
// a fresh salt each time.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  const salts = new Set()
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out) && out.length === 3, `fixture ${i}: [boolean, boolean, hash] required`)
    assert.deepStrictEqual(out.slice(0, 2), expected, `fixture ${i}`)
    assert.match(String(out[2]), /^\$2[aby]\$08\$[./A-Za-z0-9]{53}$/, `fixture ${i}: a 60-character bcrypt hash at cost 8 is required`)
    salts.add(out[2].slice(7, 29))
  }
  assert.equal(salts.size, cases.length, 'every hash must use a fresh salt')
  for (const pair of ['true,false', 'false,true', 'false,false', 'true,true']) assert.ok(cases.some(c => String(c.expected) === pair), `no fixture expects ${pair}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value[0] ? 1 : 0) + (value[1] ? 2 : 0)
