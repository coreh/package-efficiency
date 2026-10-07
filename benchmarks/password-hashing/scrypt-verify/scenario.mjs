import { strict as assert } from 'node:assert'
const words = ['correct horse battery staple', 'hunter2', 'P@ssw0rd!', 'café au lait', '日本語のパスワード', 'пароль123', '😀🔐 emoji pass', 'tab\tand space ', 'x', 'The quick brown fox jumps over the lazy dog']
const tweak = (s, i) => [s + ' ', s.toUpperCase() === s ? s.toLowerCase() : s.toUpperCase(), s.slice(0, -1) + (s.endsWith('a') ? 'b' : 'a'), 'x' + s][i % 4]
export const cases = Array.from({ length: 32 }, (_, i) => {
  const base = words[i % words.length]
  const password = i < 10 ? base : `${base}-${i * 7919}${i % 3 === 0 ? '!'.repeat(i) : ''}`
  return { input: [password, tweak(password, i)], expected: [true, false] }
})
cases[31] = { input: ['a'.repeat(72), 'a'.repeat(71) + 'b'], expected: [true, false] }
for (const { input } of cases) assert.notEqual(input[0], input[1])
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepStrictEqual(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value[0] ? 1 : 0) + (value[1] ? 2 : 0)
