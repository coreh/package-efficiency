import { strict as assert } from 'node:assert'
// Each input is { style, a, b, c }. Simple and chained styles wrap `a`; nested
// styles wrap `a + inner(b) + c` so the outer style must survive the inner one.
const FG = { red: 31, green: 32, blue: 34 }
const spec = {
  red: { fg: 'red' }, green: { fg: 'green' }, bold: { bold: true }, underline: { underline: true },
  'bold-blue': { fg: 'blue', bold: true }, 'red-bold-underline': { fg: 'red', bold: true, underline: true },
}
const nested = {
  'bold-in-red': [{ fg: 'red' }, { bold: true }], 'underline-in-green': [{ fg: 'green' }, { underline: true }],
  'red-in-bold': [{ bold: true }, { fg: 'red' }], 'deep': [{ underline: true }, { fg: 'red', bold: true }],
}
export const styles = [...Object.keys(spec), ...Object.keys(nested)]
const words = ['build', 'passed', 'error: file not found', 'warning', 'Ünïcödé café 日本語', '12 tests', 'done in 1.2s', 'x', 'GET /api/users 200', '😀 ok']
const base = { fg: null, bold: false, underline: false }
const state = (...s) => Object.assign({}, base, ...s)
const key = (s) => `${s.fg}|${s.bold}|${s.underline}`
// Reference: a list of [text, state] runs for a fixture.
const reference = ({ style, a, b, c }) => {
  const runs = spec[style] ? [[a, state(spec[style])]] : [[a, state(nested[style][0])], [b, state(nested[style][0], nested[style][1])], [c, state(nested[style][0])]]
  return merge(runs)
}
const merge = (runs) => {
  const out = []
  for (const [t, s] of runs) {
    if (!t) continue
    const last = out[out.length - 1]
    if (last && key(last[1]) === key(s)) last[0] += t; else out.push([t, s])
  }
  return out
}
// Interpret SGR escape codes into runs. Any other escape, an unknown code or
// style left open at the end is an error. Equivalent spellings are accepted.
const render = (text) => {
  assert.equal(typeof text, 'string', 'string output required')
  const runs = []
  let s = state()
  let pos = 0
  const re = /\x1b\[([0-9;]*)m/g
  let m
  const push = (t) => { if (t) { assert.ok(!t.includes('\x1b'), 'unsupported escape sequence'); runs.push([t, { ...s }]) } }
  while ((m = re.exec(text))) {
    push(text.slice(pos, m.index))
    pos = re.lastIndex
    for (const code of (m[1] || '0').split(';').map(Number)) {
      if (code === 0) s = state()
      else if (code === 1) s.bold = true
      else if (code === 22) s.bold = false
      else if (code === 4) s.underline = true
      else if (code === 24) s.underline = false
      else if (code === 39) s.fg = null
      else if (code >= 30 && code <= 37) s.fg = code
      else assert.fail(`unexpected code ${code}`)
    }
  }
  push(text.slice(pos))
  assert.deepEqual(s, state(), 'style left open at the end')
  return merge(runs)
}
export const cases = Array.from({ length: 60 }, (_, i) => {
  const style = styles[i % styles.length]
  const input = { style, a: `${i}: ${words[i % words.length]}`, b: words[(i * 3 + 1) % words.length], c: words[(i * 7 + 2) % words.length] + ' '.repeat(i % 3) }
  return { input, expected: reference(input) }
})
cases.push({ input: { style: 'red', a: '', b: '', c: '' }, expected: [] }, { input: { style: 'bold-in-red', a: 'a', b: '', c: 'c' }, expected: [['ac', { fg: 'red', bold: false, underline: false }]] })
// The reference names colors; convert them to SGR codes for comparison.
for (const c of cases) c.expected = c.expected.map(([t, s]) => [t, { ...s, fg: typeof s.fg === 'string' ? FG[s.fg] : s.fg }])
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(render(outputs[i]), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
