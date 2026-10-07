import { strict as assert } from 'node:assert'
// Deterministic generator: a small linear congruential sequence, no randomness.
let seed = 20261006
const next = (n) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return (seed >>> 8) % n
}
const spaces = ['', ' ', '  ', ' ', '\t', '']
const sp = (wide) => (wide ? spaces[next(spaces.length)] : '')
const number = () => {
  switch (next(5)) {
    case 0: return String(next(10))
    case 1: return String(next(1000))
    case 2: return `${next(100)}.${next(1000)}`
    case 3: return `${next(10)}.${String(next(100)).padStart(2, '0')}`
    default: return String(next(100000))
  }
}
// Each generator returns { text, value } where value is computed in exactly the
// order the grammar prescribes: left to right within a chain of + - or * /.
const expr = (depth, wide) => {
  const first = term(depth, wide)
  let { text, value } = first
  const n = depth > 0 ? next(4) : next(2)
  for (let i = 0; i < n; i++) {
    const plus = next(2) === 0
    const rhs = term(depth, wide)
    text += sp(wide) + (plus ? '+' : '-') + sp(wide) + rhs.text
    value = plus ? value + rhs.value : value - rhs.value
  }
  return { text, value }
}
const term = (depth, wide) => {
  let { text, value } = factor(depth, wide)
  const n = depth > 0 ? next(3) : next(2)
  for (let i = 0; i < n; i++) {
    const times = next(3) !== 0
    let rhs = factor(depth, wide)
    if (!times && rhs.value === 0) rhs = { text: '4', value: 4 }
    text += sp(wide) + (times ? '*' : '/') + sp(wide) + rhs.text
    value = times ? value * rhs.value : value / rhs.value
  }
  return { text, value }
}
const factor = (depth, wide) => {
  const pick = next(depth > 0 ? 6 : 3)
  if (pick < 3) {
    const text = number()
    return { text, value: Number(text) }
  }
  if (pick === 3) {
    const inner = factor(depth - 1, wide)
    return { text: '-' + sp(wide) + inner.text, value: -inner.value }
  }
  const inner = expr(depth - 1, wide)
  return { text: '(' + sp(wide) + inner.text + sp(wide) + ')', value: inner.value }
}
const build = (depth, wide, repeat) => {
  for (;;) {
    let text = ''
    let value = 0
    for (let i = 0; i < repeat; i++) {
      const e = expr(depth, wide)
      text += (i ? sp(true) + (i % 2 ? '+' : '-') + sp(wide) + '(' : '(') + e.text + ')'
      value = i === 0 ? e.value : i % 2 ? value + e.value : value - e.value
    }
    if (Number.isFinite(value) && Math.abs(value) < 1e15) return { text: sp(wide) + text + sp(wide), value }
  }
}
const fixed = [
  ['1', 1], ['-1', -1], ['2+3*4', 14], ['(2+3)*4', 20], ['10-4-3', 3], ['100/10/5', 2], ['8/4*2', 4],
  ['--3', 3], ['-(2+3)', -5], [' 1 + 2 ', 3], ['0.5*4', 2], ['1.25 - 0.25', 1], ['((((7))))', 7], ['2*-3', -6],
]
export const cases = [
  ...fixed.map(([input, expected]) => ({ input, expected })),
  ...Array.from({ length: 30 }, (_, i) => {
    const { text, value } = build(1 + (i % 4), i % 3 !== 0, 1 + (i % 6) * (1 + (i % 3)) + Math.floor(i / 5) * 3)
    return { input: text, expected: value }
  }),
]
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: a number is required`)
    assert.ok(outputs[i] === expected, `fixture ${i}: expected ${expected}, got ${outputs[i]}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (typeof value === 'number' ? 1 : 0)
