import { strict as assert } from 'node:assert'

const words = ['alpha', 'beta', 'gamma', 'delta', 'cache', 'stream', 'parser', 'buffer', 'window', 'socket', 'render', 'token']
const word = (i, n) => words[(i * 7 + n * 3) % words.length]
const sentence = (i) => `${word(i, 0)} ${word(i, 1)} ${word(i, 2)} ${word(i, 3)} ${word(i, 4)}`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Each block returns [markdown, html].
const blocks = [
  (i) => [`# ${sentence(i)}`, `<h1>${sentence(i)}</h1>`],
  (i) => [`## ${word(i, 5)} ${word(i, 6)}`, `<h2>${word(i, 5)} ${word(i, 6)}</h2>`],
  (i) => [`### ${word(i, 7)}`, `<h3>${word(i, 7)}</h3>`],
  (i) => [`${sentence(i)} and *${word(i, 8)}* with **${word(i, 9)}** plus \`${word(i, 10)}()\`.`,
    `<p>${sentence(i)} and <em>${word(i, 8)}</em> with <strong>${word(i, 9)}</strong> plus <code>${word(i, 10)}()</code>.</p>`],
  (i) => [`See [${word(i, 1)} docs](https://example.com/${word(i, 2)}/${i}) for ${sentence(i + 1)}.\nSecond line of ${word(i, 3)}.`,
    `<p>See <a href="https://example.com/${word(i, 2)}/${i}">${word(i, 1)} docs</a> for ${sentence(i + 1)}.\nSecond line of ${word(i, 3)}.</p>`],
  (i) => {
    const n = 2 + (i % 4)
    const items = Array.from({ length: n }, (_, k) => `${word(i, k)} ${word(i, k + 5)}`)
    return [items.map((t) => `- ${t}`).join('\n'), `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`]
  },
  (i) => {
    const n = 2 + (i % 3)
    const items = Array.from({ length: n }, (_, k) => `${word(i, k + 2)} **${word(i, k)}**`)
    return [items.map((t, k) => `${k + 1}. ${t}`).join('\n'),
      `<ol>${items.map((t) => `<li>${t.replace(/\*\*(\w+)\*\*/, '<strong>$1</strong>')}</li>`).join('')}</ol>`]
  },
  (i) => [`> ${sentence(i)}\n> more *${word(i, 4)}* text`, `<blockquote><p>${sentence(i)}\nmore <em>${word(i, 4)}</em> text</p></blockquote>`],
  (i) => {
    const code = `if (${word(i, 0)} < ${i} && ${word(i, 1)}) {\n  return ${word(i, 2)}(${i});\n}\n`
    return ['```js\n' + code + '```', `<pre><code class="language-js">${esc(code)}</code></pre>`]
  },
  () => ['---', '<hr>'],
]

const build = (seed, count) => {
  const md = []
  const html = []
  for (let k = 0; k < count; k++) {
    const [m, h] = blocks[(seed * 5 + k * 3 + (k >> 2)) % blocks.length](seed + k)
    md.push(m)
    html.push(h)
  }
  return { input: md.join('\n\n') + '\n', expected: html.join('') }
}

// Blocks per document. Kept at 8 and above so that parsing, not per-call setup, is most of a call.
const sizes = [8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80]
export const cases = Array.from({ length: 36 }, (_, i) => build(i + 1, sizes[i % sizes.length]))

const normalize = (s) => s.replace(/<hr \/>/g, '<hr>').replace(/>\s+</g, '><').trim()

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
