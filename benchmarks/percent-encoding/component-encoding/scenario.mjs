import { strict as assert } from 'node:assert'
// Independent oracle: keep A-Z a-z 0-9 - _ . ~ ; every other UTF-8 byte becomes %XX.
const enc = new TextEncoder()
const oracle = (s) => {
  let out = ''
  for (const b of enc.encode(s)) {
    const c = String.fromCharCode(b)
    out += b < 128 && /[A-Za-z0-9\-_.~]/.test(c) ? c : '%' + b.toString(16).toUpperCase().padStart(2, '0')
  }
  return out
}
// Accepted spellings: lowercase hex, '+' for space, and the characters !'()*
// left literal (encodeURIComponent and several libraries do). All decode alike.
const normalize = (s) => s
  .replace(/\+/g, '%20')
  .replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase())
  .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
const pieces = [
  'plain-text_value.1~', 'hello world ', 'a=b&c=d;e=f', 'https://example.com/a/b?q=1#frag',
  'café crème brûlée', '日本語のテキスト', 'Привет, мир', '😀🎉 party',
  'user+tag@mail.example.org', '50% off!', "it's (really) *great*", '[brackets]{braces}<angles>|pipe\\back^caret`tick',
  'tab\there\nnewline', '$100,000.00 / month', 'path/with spaces/and%percent', 'العربية مرحبا',
]
export const cases = Array.from({ length: 60 }, (_, i) => {
  let s = `${i}:`
  for (let k = 0; s.length < 40 + (i % 6) * 40; k++) s += pieces[(i * 7 + k * 5 + (i >> 2)) % pieces.length] + (k % 3 ? '' : '/')
  return { input: s, expected: oracle(s) }
})
cases.push({ input: '', expected: '' })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(normalize(outputs[i]), normalize(expected), `fixture ${i}`)
    if (/[^A-Za-z0-9\-_.~]/.test(input)) assert.notEqual(outputs[i], input, `fixture ${i}: unchanged`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
