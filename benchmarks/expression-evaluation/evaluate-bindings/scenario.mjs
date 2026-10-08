import { strict as assert } from 'node:assert'

// Fixtures are generated from a seeded generator. The generator keeps the tree
// it wrote, so the scenario evaluates the tree itself (never a package) to get
// the expected values.
let seed = 20261007
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (list) => list[Math.floor(rnd() * list.length)]
const NAMES = ['a', 'b', 'c', 'd', 'x', 'y', 'z', 'w']
// Never a whole number, so that JSON readers in every language give a float.
const VALUES = [0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 3.25, 3.5, 4.75, 0.125, 6.5, 7.25, 0.375]
const makeVars = () => Array.from({ length: 8 }, () => Object.fromEntries(NAMES.map((n) => [n, pick(VALUES) * (rnd() < 0.4 ? -1 : 1)])))

// Tree nodes: {n: literal}, {v: name}, {neg}, {op, l, r}, {fn, args}, {cmp, l, r}
const literal = () => ({ n: pick([0.5, 1.5, 2.0, 2.5, 3.0, 0.25, 10.0, 0.75, 4.5, 1.25, 7.0]) })
const leaf = () => (rnd() < 0.7 ? { v: pick(NAMES) } : literal())
const ops = (t) => (t.n !== undefined || t.v !== undefined ? 0 : t.neg ? 1 + ops(t.neg) : t.fn ? 1 + t.args.reduce((s, a) => s + ops(a), 0) : 1 + ops(t.l) + ops(t.r))
const gen = (budget) => {
  if (budget <= 0) return leaf()
  const r = rnd()
  if (r < 0.1) return { neg: gen(budget - 1) }
  if (r < 0.25) return { fn: 'abs', args: [gen(budget - 1)] }
  if (r < 0.4) {
    const left = Math.floor((budget - 1) / 2)
    return { fn: pick(['min', 'max']), args: [gen(left), gen(budget - 1 - left)] }
  }
  const left = Math.floor(rnd() * budget)
  const op = pick(['+', '-', '*', '/', '+', '-', '*'])
  const l = gen(left)
  // A denominator is kept away from zero: abs(...) + 1.0.
  const r2 = gen(budget - 1 - left - (op === '/' ? 2 : 0))
  return { op, l, r: op === '/' ? { op: '+', l: { fn: 'abs', args: [r2] }, r: { n: 1.0 } } : r2 }
}
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2 }
const lit = (x) => x.toFixed(2)
const render = (t, ctx = 'top') => {
  if (t.n !== undefined) return lit(t.n)
  if (t.v !== undefined) return t.v
  if (t.neg) { const text = `-${render(t.neg, 'unary')}`; return ctx.startsWith('right') || ctx === 'unary' ? `(${text})` : text }
  if (t.fn) return `${t.fn}(${t.args.map((a) => render(a, 'top')).join(', ')})`
  const text = `${render(t.l, 'left' + PREC[t.op])} ${t.op} ${render(t.r, 'right' + PREC[t.op])}`
  if (ctx === 'top') return text
  const need = ctx === 'unary' || (ctx.startsWith('left') && PREC[t.op] < Number(ctx.slice(4))) || (ctx.startsWith('right') && PREC[t.op] <= Number(ctx.slice(5)))
  return need ? `(${text})` : text
}
const evalTree = (t, vars) => {
  if (t.n !== undefined) return t.n
  if (t.v !== undefined) return vars[t.v]
  if (t.neg) return -evalTree(t.neg, vars)
  if (t.fn) {
    const a = t.args.map((x) => evalTree(x, vars))
    return t.fn === 'abs' ? Math.abs(a[0]) : t.fn === 'min' ? Math.min(a[0], a[1]) : Math.max(a[0], a[1])
  }
  const l = evalTree(t.l, vars), r = evalTree(t.r, vars)
  if (t.cmp) return t.cmp === '<' ? l < r : t.cmp === '<=' ? l <= r : t.cmp === '>' ? l > r : l >= r
  return t.op === '+' ? l + r : t.op === '-' ? l - r : t.op === '*' ? l * r : l / r
}
const cmpNode = (cmp, l, r) => ({ cmp, l, r })
const renderRoot = (t) => (t.cmp ? `${render(t.l)} ${t.cmp} ${render(t.r)}` : render(t))

// Hand-written fixtures first: precedence and associativity traps.
const V = (name) => ({ v: name }), N = (n) => ({ n })
const B = (op, l, r) => ({ op, l, r })
const handmade = [
  B('-', B('-', V('a'), V('b')), V('c')),
  B('-', V('a'), B('-', V('b'), V('c'))),
  B('/', B('/', V('a'), B('+', { fn: 'abs', args: [V('b')] }, N(1))), B('+', { fn: 'abs', args: [V('c')] }, N(2))),
  B('+', V('a'), B('*', V('b'), V('c'))),
  B('*', B('+', V('a'), V('b')), B('-', V('c'), V('d'))),
  B('*', { neg: V('a') }, V('b')),
  { neg: B('+', V('a'), B('*', V('b'), N(2.5))) },
  B('-', V('x'), B('*', N(0.5), { neg: V('y') })),
  B('+', B('-', V('a'), B('*', V('b'), V('c'))), B('/', V('d'), B('+', { fn: 'abs', args: [V('x')] }, N(1)))),
  cmpNode('<', B('+', V('a'), V('b')), B('*', V('c'), V('d'))),
  cmpNode('>=', B('-', V('x'), V('y')), B('+', V('z'), N(0.5))),
  cmpNode('<=', { fn: 'max', args: [V('a'), V('b')] }, { fn: 'min', args: [V('c'), V('d')] }),
]
const trees = [...handmade]
const targets = [5, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 34, 38]
const MAX_MAGNITUDE = 1e4
for (let i = 0; trees.length < 40; i++) {
  const comparison = trees.length >= 28 ? trees.length % 2 === 0 : trees.length % 4 === 3
  const budget = targets[(trees.length + i) % targets.length]
  const t = comparison ? cmpNode(pick(['<', '<=', '>', '>=']), gen(Math.floor(budget / 2)), gen(Math.ceil(budget / 2))) : gen(budget)
  if (ops(t) < 5 || ops(t) > 40) continue
  trees.push(t)
}
// Variable sets are chosen per fixture so that magnitudes stay moderate, and,
// for a comparison, so that no two sides are nearly tied and both outcomes occur.
const accepted = []
export const cases = []
for (const t of trees) {
  let chosen = null
  for (let attempt = 0; attempt < 500 && !chosen; attempt++) {
    const vars = makeVars()
    let ok = true, truths = 0
    for (const v of vars) {
      if (t.cmp) {
        const l = evalTree(t.l, v), r = evalTree(t.r, v)
        if (!Number.isFinite(l) || !Number.isFinite(r) || Math.abs(l) > MAX_MAGNITUDE || Math.abs(r) > MAX_MAGNITUDE || Math.abs(l - r) < 1e-3 * (1 + Math.abs(l) + Math.abs(r))) { ok = false; break }
        if (evalTree(t, v)) truths++
      } else {
        const x = evalTree(t, v)
        if (!Number.isFinite(x) || Math.abs(x) > MAX_MAGNITUDE) { ok = false; break }
      }
    }
    if (ok && (!t.cmp || (truths >= 2 && truths <= 6))) chosen = vars
  }
  assert.ok(chosen, `no usable variable sets for ${renderRoot(t)}`)
  cases.push({ input: { expr: renderRoot(t), vars: chosen } })
  accepted.push(chosen.map((v) => evalTree(t, v)))
}

const close = (got, want) => Math.abs(got - want) <= 1e-9 * Math.max(1, Math.abs(want))
export const verifyOne = (i, output) => {
  const want = accepted[i]
  assert.ok(Array.isArray(output), `fixture ${i}: a list of 8 values is required`)
  assert.equal(output.length, 8, `fixture ${i}: 8 values required`)
  for (let k = 0; k < 8; k++) {
    const got = output[k], w = want[k]
    const where = `fixture ${i} (${cases[i].input.expr}) set ${k}: got ${got}, expected ${w}`
    if (typeof w === 'boolean') {
      // A comparison: a boolean, or the number 1 or 0 that some libraries give for it.
      assert.ok(got === w || got === (w ? 1 : 0), where)
    } else {
      assert.equal(typeof got, 'number', where)
      assert.ok(close(got, w), where)
    }
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check can fail: values that do not come from evaluating the
// expression (zeros, the first variable, a wrong tree) are rejected.
for (const wrong of [() => new Array(8).fill(0), () => new Array(8).fill(false), (c) => c.vars.map((v) => v.a)]) {
  assert.throws(() => verifyResults(cases.map(({ input }) => wrong(input))), undefined, 'a stub passed the check')
}
assert.ok(cases.some(({ input }) => /[<>]/.test(input.expr)) && cases.some(({ input }) => /\//.test(input.expr)) && cases.some(({ input }) => /min|max/.test(input.expr)))
