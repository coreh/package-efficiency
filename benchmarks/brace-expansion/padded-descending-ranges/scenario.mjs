import { strict as assert } from 'node:assert'
// Independent reference expander (bash order) for the supported syntax:
// comma lists plus numeric ranges, ascending or descending, optionally zero padded.
const splitTop = (s) => { const parts = []; let depth = 0, cur = ''; for (const c of s) { if (c === '{') depth++; if (c === '}') depth--; if (c === ',' && depth === 0) { parts.push(cur); cur = '' } else cur += c } parts.push(cur); return parts }
const range = (a, b) => {
  const pad = (a.length > 1 && a[0] === '0') || (b.length > 1 && b[0] === '0') ? Math.max(a.length, b.length) : 0
  const x = +a, y = +b, step = x <= y ? 1 : -1, out = []
  for (let v = x; step > 0 ? v <= y : v >= y; v += step) out.push(String(v).padStart(pad, '0'))
  return out
}
const expandRef = (p) => {
  let depth = 0, start = -1
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '{') { if (depth++ === 0) start = i } else if (p[i] === '}' && --depth === 0) {
      const pre = p.slice(0, start), body = p.slice(start + 1, i), post = p.slice(i + 1)
      const m = /^(\d+)\.\.(\d+)$/.exec(body)
      const items = m ? range(m[1], m[2]) : splitTop(body).flatMap(expandRef)
      const tails = expandRef(post)
      return items.flatMap((x) => tails.map((t) => pre + x + t))
    }
  }
  return [p]
}
const roots = ['frames', 'logs/2026', 'backup', 'shots']
const patterns = []
for (let i = 0; i < 48; i++) {
  const r = roots[i % 4], n = 20 + (i * 37) % 280, s = 1 + (i % 7), w = 3 + (i % 3)
  const z = (v, width) => String(v).padStart(width, '0')
  switch (i % 8) {
    case 0: patterns.push(`${r}/img{${z(s, w)}..${z(s + n, w)}}.png`); break
    case 1: patterns.push(`${r}/part{${s + n}..${s}}.bin`); break
    case 2: patterns.push(`${r}/seg{${z(s + n, w)}..${z(s, w)}}.ts`); break
    case 3: patterns.push(`${r}-{0${s}..1${s}}-{00..09}`); break
    case 4: patterns.push(`{${n}..${n - 15}}.{${z(1, 2)}..${z(4, 2)}}`); break
    case 5: patterns.push(`${r}/{${z(s, 4)}..${z(s + n, 4)}}`); break
    case 6: patterns.push(`vol{9..1}/disk{${z(1, 2)}..${z(12, 2)}}`); break
    case 7: patterns.push(`${r}/{${z(s + 9, 3)}..${z(s, 3)}}.{log,gz}`); break
  }
}
export const cases = patterns.map((input) => ({ input, expected: expandRef(input) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: list output required`)
    assert.deepEqual([...outputs[i]], expected, `fixture ${i}: ${input}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
