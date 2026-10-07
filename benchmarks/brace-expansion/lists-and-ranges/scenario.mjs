import { strict as assert } from 'node:assert'
// Independent reference expander (bash order) for the supported syntax.
const splitTop = (s) => { const parts = []; let depth = 0, cur = ''; for (const c of s) { if (c === '{') depth++; if (c === '}') depth--; if (c === ',' && depth === 0) { parts.push(cur); cur = '' } else cur += c } parts.push(cur); return parts }
const expandRef = (p) => {
  let depth = 0, start = -1
  for (let i = 0; i < p.length; i++) {
    if (p[i] === '{') { if (depth++ === 0) start = i } else if (p[i] === '}' && --depth === 0) {
      const pre = p.slice(0, start), body = p.slice(start + 1, i), post = p.slice(i + 1)
      const m = /^(\d+)\.\.(\d+)$/.exec(body)
      const items = m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, k) => String(+m[1] + k)) : splitTop(body).flatMap(expandRef)
      const tails = expandRef(post)
      return items.flatMap((x) => tails.map((t) => pre + x + t))
    }
  }
  return [p]
}
const roots = ['src', 'lib/core', 'app', 'packages']
const exts = ['js', 'ts', 'mjs']
const patterns = []
for (let i = 0; i < 48; i++) {
  const r = roots[i % 4], a = 2 + (i % 5), n = 3 + (i * 7) % 18, s = 1 + (i % 4)
  switch (i % 8) {
    case 0: patterns.push(`${r}/{index,main,util,types}.{${exts.join(',')}}`); break
    case 1: patterns.push(`file{${s}..${s + n}}.txt`); break
    case 2: patterns.push(`${r}/{a,b{1,2,3},c{x,y}}/test{${s}..${s + a}}`); break
    case 3: patterns.push(`img-{${s}..${s + 3}}-{small,large}.{png,webp}`); break
    case 4: patterns.push(`{one,two,three,four,five,six}-${i}`); break
    case 5: patterns.push(`v{1..${a}}.{0..${a}}.{${s}..${s + 2}}`); break
    case 6: patterns.push(`/etc/{nginx/{sites,conf}.d,ssl/{certs,private},{${s}..${s + n}}}/${i}`); break
    case 7: patterns.push(`{${s}..${s + n}}{,x}`.replace('{,x}', '{x,y}') + `-${r}`); break
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
