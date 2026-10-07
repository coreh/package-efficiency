import { strict as assert } from 'node:assert'
// Each input is { style, a, b, c, d, e }. Every style nests a colored or dimmed
// span inside an outer span whose close code the inner span shares (a color
// closes with 39 whatever its color, bold and dim both close with 22), so the
// outer style only survives if the library reopens it after the inner close.
const FG = { red: 31, green: 32, yellow: 33, blue: 34 }
const L = (spec, ...parts) => ({ spec, parts })
// Trees of styled parts: strings are plain text, objects are styled spans.
const trees = {
  'red-green-twice': ({ a, b, c, d, e }) => L({ fg: 'red' }, a, L({ fg: 'green' }, b), c, L({ fg: 'green' }, d), e),
  'blue-yellow': ({ a, b, c }) => L({ fg: 'blue' }, a, L({ fg: 'yellow' }, b), c),
  'bold-dim': ({ a, b, c }) => L({ bold: true }, a, L({ dim: true }, b), c),
  'three-level': ({ a, b, c, d, e }) => L({ fg: 'red' }, a, L({ fg: 'green' }, b, L({ fg: 'blue' }, c), d), e),
  'bold-red-dim': ({ a, b, c, d, e }) => L({ bold: true }, a, L({ fg: 'red' }, b, L({ dim: true }, c), d), e),
}
export const styles = Object.keys(trees)
const words = ['build', 'passed', 'error: file not found', 'warning', 'Ünïcödé café 日本語', '12 tests', 'done in 1.2s', 'x', 'GET /api/users 200', '😀 ok']
const base = { fg: null, bold: false, dim: false, underline: false }
const key = (s) => `${s.fg}|${s.bold}|${s.dim}|${s.underline}`
const merge = (runs) => {
  const out = []
  for (const [t, s] of runs) {
    if (!t) continue
    const last = out[out.length - 1]
    if (last && key(last[1]) === key(s)) last[0] += t; else out.push([t, s])
  }
  return out
}
// Reference: walk the tree and collect [text, state] runs.
const walk = (node, s, runs) => {
  if (typeof node === 'string') return void runs.push([node, s])
  const next = { ...s, ...node.spec }
  for (const p of node.parts) walk(p, next, runs)
}
const reference = (input) => {
  const runs = []
  walk(trees[input.style](input), base, runs)
  return merge(runs.map(([t, s]) => [t, { ...s, fg: s.fg ? FG[s.fg] : null }]))
}
// Interpret SGR escape codes into runs. Any other escape, an unknown code or
// style left open at the end is an error. Equivalent spellings are accepted;
// code 22 turns off bold and dim together, as a terminal does.
const render = (text) => {
  assert.equal(typeof text, 'string', 'string output required')
  const runs = []
  let s = { ...base }
  let pos = 0
  const re = /\x1b\[([0-9;]*)m/g
  let m
  const push = (t) => { if (t) { assert.ok(!t.includes('\x1b'), 'unsupported escape sequence'); runs.push([t, { ...s }]) } }
  while ((m = re.exec(text))) {
    push(text.slice(pos, m.index))
    pos = re.lastIndex
    for (const code of (m[1] || '0').split(';').map(Number)) {
      if (code === 0) s = { ...base }
      else if (code === 1) s.bold = true
      else if (code === 2) s.dim = true
      else if (code === 22) { s.bold = false; s.dim = false }
      else if (code === 4) s.underline = true
      else if (code === 24) s.underline = false
      else if (code === 39) s.fg = null
      else if (code >= 30 && code <= 37) s.fg = code
      else assert.fail(`unexpected code ${code}`)
    }
  }
  push(text.slice(pos))
  assert.deepEqual(s, base, 'style left open at the end')
  return merge(runs)
}
export const cases = Array.from({ length: 60 }, (_, i) => {
  const w = (k) => words[(i * k + k) % words.length]
  const input = { style: styles[i % styles.length], a: `${i}: ${w(1)}`, b: w(3), c: w(7) + ' '.repeat(i % 3), d: w(9), e: `${w(11)} ${i}` }
  return { input, expected: reference(input) }
})
cases.push({ input: { style: 'blue-yellow', a: 'a', b: '', c: 'c', d: '', e: '' } }, { input: { style: 'bold-dim', a: '', b: 'b', c: '', d: '', e: '' } })
for (const c of cases.slice(-2)) c.expected = reference(c.input)
// A wrong implementation that wraps without reopening fails here: after an
// inner close the outer color or bold must be back on.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(render(outputs[i]), expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
