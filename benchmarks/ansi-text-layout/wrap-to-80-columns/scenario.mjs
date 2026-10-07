import { strict as assert } from 'node:assert'

const WIDTH = 80
const words = ['build', 'passed', 'error:', 'warning', 'index.ts', 'café', 'naïve', 'résumé', 'ok', 'failed', 'in', '12ms', 'compiling', 'done', 'x', 'resolved', 'package', '100%', 'über', 'deprecated', 'señor', 'the', 'of', 'dependencies']
const styles = ['\x1b[0m', '\x1b[1m', '\x1b[4m', '\x1b[31m', '\x1b[1;32m', '\x1b[90m', '\x1b[93m', '\x1b[38;5;208m', '\x1b[48;5;17m', '\x1b[38;2;255;100;0m', '\x1b[22;39m', '\x1b[0m']

const build = (i, columns) => {
  let plain = ''
  let styled = ''
  let n = 0
  while (plain.length < columns) {
    const word = words[(i * 7 + n * 5 + (n >> 2)) % words.length]
    const sep = plain === '' ? '' : ' '
    plain += sep + word
    styled += sep + word
    if (n % (2 + (i % 3)) === 1) styled += styles[(i * 5 + n) % styles.length]
    if (n % 4 === 0) styled = styles[(i + n) % styles.length] + styled
    n++
  }
  return { input: styled, plain }
}

export const cases = Array.from({ length: 40 }, (_, i) => build(i, 90 + ((i * 211) % 811)))

const SGR = /\x1b\[[0-9;]*m/g
const count = (s, ch) => { let c = 0; for (let i = 0; i < s.length; i++) if (s[i] === ch) c++; return c }
const greedyLines = (plain) => {
  let lines = 1
  let len = 0
  for (const w of plain.split(' ')) {
    if (len === 0) len = w.length
    else if (len + 1 + w.length <= WIDTH) len += 1 + w.length
    else { lines++; len = w.length }
  }
  return lines
}

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, plain }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: string output required`)
    const lines = out.replace(SGR, '').split('\n')
    for (const line of lines) {
      assert.ok(line.length > 0, `fixture ${i}: empty line`)
      assert.ok(line.length <= WIDTH, `fixture ${i}: line wider than ${WIDTH}`)
    }
    assert.equal(lines.join(' '), plain, `fixture ${i}: visible text changed`)
    const greedy = greedyLines(plain)
    assert.ok(lines.length >= Math.ceil(plain.length / WIDTH) && lines.length <= greedy + 1, `fixture ${i}: ${lines.length} lines, greedy ${greedy}`)
    assert.ok(count(out, '\x1b') >= count(input, '\x1b'), `fixture ${i}: escape codes dropped`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
