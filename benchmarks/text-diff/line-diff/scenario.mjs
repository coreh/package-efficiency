import { strict as assert } from 'node:assert'

// Deterministic generator: no randomness, the same fixtures in every process.
let seed = 20261006
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296

const words = ['config', 'user', 'render', 'buffer', 'index', 'token', 'cache', 'route', 'parse', 'emit']
// Every base line is unique (it carries its own number), so the longest common
// subsequence of a case is exactly its unchanged lines and the diff is unique
// up to the order of removed and added lines inside one changed block.
const baseLine = (i) => `${'  '.repeat(i % 3)}const ${words[i % 10]}_${i} = ${words[(i * 7) % 10]}(${i}, "${words[(i * 3) % 10]}-${i}"); // line ${i}`

// Common shape of a result: a list of [op, count] runs in order, op being
// '=' (lines in both), '-' (only in the first text) or '+' (only in the second).
const make = (n, rate) => {
  const a = [], b = [], events = []
  let fresh = 0
  const push = (op) => events.push(op)
  for (let i = 0; i < n; i++) {
    const r = next()
    if (r >= rate) { a.push(baseLine(i)); b.push(baseLine(i)); push('='); continue }
    const kind = Math.floor(next() * 3)
    if (kind === 0) { a.push(baseLine(i)); b.push(`replaced ${fresh++} é // new text`); push('-'); push('+') }
    else if (kind === 1) { a.push(baseLine(i)); push('-') }
    else { a.push(baseLine(i)); b.push(baseLine(i)); b.push(`added ${fresh++} 日本`); push('='); push('+') }
  }
  return { a, b, events }
}
const text = (lines) => lines.map((l) => l + '\n').join('')
// Normal form: runs of '=' and, between them, one [removed, added] block.
const normalizeEvents = (ops) => {
  const out = []
  let eq = 0, del = 0, ins = 0
  const flushChange = () => { if (del || ins) out.push(['~', del, ins]); del = ins = 0 }
  for (const [op, n] of ops) {
    if (op === '=') { flushChange(); eq += n; continue }
    if (eq) { out.push(['=', eq]); eq = 0 }
    if (op === '-') del += n; else ins += n
  }
  flushChange()
  if (eq) out.push(['=', eq])
  return out
}

const fixtures = []
const sizes = [10, 14, 20, 25, 32, 40, 48, 60, 75, 90, 105, 120]
const rates = [0.01, 0.1, 0.5]
for (const [r, rate] of rates.entries()) {
  for (const [s, n] of sizes.entries()) {
    if ((s + r) % 3 === 2 && n < 20) continue
    fixtures.push(make(n, rate))
  }
}
// Edge cases: identical, nothing in common, empty on either side, one line.
const lines = (n, tag) => Array.from({ length: n }, (_, i) => `${tag} ${i}`)
fixtures.push({ a: lines(30, 'same'), b: lines(30, 'same'), events: Array(30).fill('=') })
fixtures.push({ a: lines(25, 'left'), b: lines(25, 'right'), events: [...Array(25).fill('-'), ...Array(25).fill('+')] })
fixtures.push({ a: [], b: lines(12, 'only'), events: Array(12).fill('+') })
fixtures.push({ a: lines(12, 'only'), b: [], events: Array(12).fill('-') })
fixtures.push({ a: ['single'], b: ['single'], events: ['='] })
fixtures.push({ a: [], b: [], events: [] })
fixtures.push({ a: ['one'], b: ['two'], events: ['-', '+'] })

const runs = (events) => { const out = []; for (const op of events) { if (out.length && out.at(-1)[0] === op) out.at(-1)[1]++; else out.push([op, 1]) } return out }
export const cases = fixtures.map(({ a, b, events }) => ({
  input: { a: text(a), b: text(b) },
  expected: normalizeEvents(runs(events)),
}))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: list of runs required`)
    for (const run of out) {
      assert.ok(Array.isArray(run) && run.length === 2 && ['=', '-', '+'].includes(run[0]) && Number.isInteger(run[1]) && run[1] > 0, `fixture ${i}: bad run ${JSON.stringify(run)}`)
    }
    // Lengths must add up to both texts, then the unchanged lines must be a longest common subsequence.
    const count = (t) => (t.match(/\n/g) ?? []).length
    const sum = (ops) => out.filter((r) => ops.includes(r[0])).reduce((n, r) => n + r[1], 0)
    assert.equal(sum(['=', '-']), count(input.a), `fixture ${i}: first text lines`)
    assert.equal(sum(['=', '+']), count(input.b), `fixture ${i}: second text lines`)
    assert.deepEqual(normalizeEvents(out), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
