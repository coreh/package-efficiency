import { strict as assert } from 'node:assert'
const escapeReference = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
// Equivalent decimal/hex entities and named apostrophes are accepted. Output
// spelling is not standardized across these packages; decoded text must agree.
const normalize = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, n) => `&#${parseInt(n, 16)};`).replace(/&apos;/g, '&#39;').replace(/&#34;/g, '&quot;').replace(/&#38;/g, '&amp;').replace(/&#60;/g, '&lt;').replace(/&#62;/g, '&gt;')
export const cases = Array.from({ length: 64 }, (_, i) => {
  const text = ['Plain ASCII text', '<a title="Tom & Jerry">it\'s here</a>', 'Already &amp; escaped &#39;', 'Unicode café 日本語 😀', '\"\'&&<<>>'][i % 5]
  const input = `${i}: ${text.repeat(1 + i % 8)}`
  return { input, expected: escapeReference(input) }
})
cases.push({ input: '', expected: '' })
// Rust submits its native outputs to this same verifier before warm-up.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(normalize(outputs[i]), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
