import { strict as assert } from 'node:assert'
const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", '#34': '"' }
const decodeReference = (s) => s.replace(/&(amp|lt|gt|quot|apos|#39|#34);/g, (_, n) => map[n])
const encoded = [
  'Plain ASCII text with no entities',
  '&lt;a title=&quot;Tom &amp; Jerry&quot;&gt;it&#39;s here&lt;/a&gt;',
  'Double &amp;lt;escaped&amp;gt; &amp;amp; text',
  'R&D and AT&T and 5 > 3 and a&b',
  'Unicode café 日本語 😀 &amp; more',
  '&amp;&amp;&lt;&lt;&gt;&gt;&quot;&quot;&apos;&#39;&#34;',
  '&lt;div class=&quot;x&quot; data-v=&apos;1&apos;&gt;&amp;&lt;/div&gt;',
  'She said &quot;it&#39;s fine&quot; and left &#39;&#34; behind'
]
export const cases = Array.from({ length: 64 }, (_, i) => {
  const text = encoded[i % encoded.length]
  const input = `${i}: ${text.repeat(1 + (i % 9))}`
  return { input, expected: decodeReference(input) }
})
cases.push({ input: '', expected: '' })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
