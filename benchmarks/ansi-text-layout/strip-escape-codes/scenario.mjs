import { strict as assert } from 'node:assert'

const words = ['build', 'passed', 'error:', 'warning', 'src/index.ts', 'café', 'naïve', '日本語', 'テスト', 'ok', '😀', 'failed', 'in', '12ms', 'compiling', 'done', 'x', 'resolved', 'package', '100%']
const styles = ['\x1b[0m', '\x1b[1m', '\x1b[4m', '\x1b[31m', '\x1b[1;32m', '\x1b[90m', '\x1b[93m', '\x1b[38;5;208m', '\x1b[48;5;17m', '\x1b[38;2;255;100;0m', '\x1b[22;39m', '\x1b[2K', '\x1b[1G', '\x1b[3A', '\x1b]8;;https://example.com/a?b=1\x07', '\x1b]8;;\x07', '\x1b]8;;https://example.org/docs\x1b\\', '\x1b]8;;\x1b\\']

// Visible text and styled text are built together, so the expected output is exact.
const build = (i, columns) => {
  let plain = ''
  let styled = ''
  let n = 0
  while ([...plain].length < columns) {
    const word = words[(i * 7 + n * 3) % words.length]
    const sep = plain === '' ? '' : ' '
    plain += sep + word
    styled += sep + word
    if (n % (2 + (i % 3)) === 1) styled += styles[(i * 5 + n) % styles.length]
    if (n % 4 === 0) styled = styles[(i + n) % styles.length] + styled
    n++
  }
  return { input: styled, expected: plain }
}

export const cases = Array.from({ length: 46 }, (_, i) => build(i, 20 + ((i * 37) % 181)))
cases.push({ input: 'plain line with no escape codes at all', expected: 'plain line with no escape codes at all' })
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
