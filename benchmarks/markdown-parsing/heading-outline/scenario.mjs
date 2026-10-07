import { strict as assert } from 'node:assert'

const words = ['alpha', 'beta', 'gamma', 'delta', 'cache', 'stream', 'parser', 'buffer', 'window', 'socket', 'render', 'token']
const word = (i, n) => words[(i * 7 + n * 3) % words.length]
const phrase = (i, n) => Array.from({ length: n }, (_, k) => word(i, k)).join(' ')

// A section returns [markdown, headings].
const section = (i) => {
  const n = 1 + (i % 6)
  const text = phrase(i, 1 + (i % 4))
  const parts = []
  let heading
  switch (i % 5) {
    case 0: heading = [1 + (i % 3), text]; parts.push(`${'#'.repeat(heading[0])} ${text}`); break
    case 1: heading = [2 + (i % 4), text]; parts.push(`${'#'.repeat(heading[0])} ${text} ${'#'.repeat(heading[0])}`); break
    case 2: heading = [1, text]; parts.push(`${text}\n${'='.repeat(text.length)}`); break
    case 3: heading = [2, text]; parts.push(`${text}\n${'-'.repeat(text.length + 2)}`); break
    default: heading = [3, text]; parts.push(`### ${text}`)
  }
  parts.push(`${phrase(i + 1, 6)} with *${word(i, 2)}*, **${word(i, 3)}** and \`${word(i, 4)}()\`; see [${word(i, 5)}](https://example.com/${word(i, 6)}/${i}).`)
  if (i % 2 === 0) parts.push(Array.from({ length: n }, (_, k) => `- ${word(i, k)} ${word(i, k + 4)}`).join('\n'))
  if (i % 3 === 0) parts.push('```sh\n# ' + phrase(i, 3) + '\n## not a heading\necho ' + i + '\n```')
  if (i % 4 === 1) parts.push('    # ' + phrase(i, 2) + '\n    ## indented code')
  if (i % 3 === 1) parts.push(`#${word(i, 8)} is a tag, not a heading, and ${phrase(i + 2, 5)}.`)
  return [parts.join('\n\n'), [heading]]
}

const build = (seed, count) => {
  const md = []
  const expected = []
  for (let k = 0; k < count; k++) {
    const [m, h] = section(seed * 3 + k)
    md.push(m)
    expected.push(...h)
  }
  return { input: md.join('\n\n') + '\n', expected }
}

const sizes = [4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40]
export const cases = Array.from({ length: 36 }, (_, i) => build(i + 1, sizes[i % sizes.length]))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array output required`)
    assert.deepEqual(outputs[i].map((h) => [Number(h[0]), h[1]]), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
