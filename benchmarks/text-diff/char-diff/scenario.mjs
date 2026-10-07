import { strict as assert } from 'node:assert'

// Deterministic generator: no randomness, the same fixtures in every process.
let seed = 20261007
const next = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296
const pick = (list) => list[Math.floor(next() * list.length)]

const subjects = ['The build server', 'Our parser', 'The cache layer', 'A background worker', 'The router', 'Maria', 'The deploy script', 'お客様', 'Café Aurora', 'The scheduler']
const verbs = ['restarted', 'rejected', 'processed', 'updated', 'indexed', 'compiled', 'archived', 'validated', 'résumé-checked', '再起動した']
const objects = ['the configuration file', 'every incoming request', 'three pending migrations', 'the user session', 'a large batch of records', 'the nightly report', 'both replicas', 'naïve queries', 'the 東京 cluster']
const tails = ['without errors', 'after a short delay', 'at 03:14 UTC', 'on the second attempt', 'in under 200 ms', 'before the deadline', 'as expected', 'with warnings', 'during the maintenance window']
const fillers = ['quickly', 'again', 'silently', 'twice', 'today', 'successfully', 'ñandú', 'gracefully']

const sentence = () => `${pick(subjects)} ${pick(verbs)} ${pick(objects)} ${pick(tails)}.`
const logLine = (i) => `[2026-10-${String(1 + (i % 28)).padStart(2, '0')} 12:${String(i % 60).padStart(2, '0')}:07] ${pick(['INFO', 'WARN', 'ERROR', 'DEBUG'])} worker-${i % 9} ${pick(verbs)} ${pick(objects)} id=${1000 + i * 37} ${pick(tails)}`
const record = (i) => `{"id":${i * 13},"name":"${pick(subjects)}","status":"${pick(verbs)}","tags":["${pick(fillers)}","${pick(tails)}"]}`
const paragraph = (n) => Array.from({ length: n }, sentence).join(' ')

const chars = (s) => [...s]
const edit = (s, kind) => {
  const c = chars(s)
  const at = () => Math.floor(next() * Math.max(1, c.length))
  const wordEdit = (fn) => {
    const words = c.join('').split(' ')
    const w = Math.floor(next() * words.length)
    fn(words, w)
    c.splice(0, c.length, ...chars(words.join(' ')))
  }
  for (let k = 0; k < kind.count; k++) {
    switch (kind.type) {
      case 'typo': { const i = at(); c[i] = pick(['x', 'q', 'é', 'z', '日']); break }
      case 'delete-char': c.splice(at(), 1); break
      case 'insert-char': c.splice(at(), 0, pick(['a', 'e', 'ü', ',', '-'])); break
      case 'replace-word': wordEdit((w, i) => { w[i] = pick(['updated', 'レビュー', 'pending', 'ÉCHEC', 'fresh']) }); break
      case 'insert-word': wordEdit((w, i) => { w.splice(i, 0, pick(fillers)) }); break
      case 'delete-word': wordEdit((w, i) => { if (w.length > 3) w.splice(i, 1) }); break
    }
  }
  return c.join('')
}

const pairs = []
const add = (a, b) => pairs.push([a, b])
const types = ['typo', 'delete-char', 'insert-char', 'replace-word', 'insert-word', 'delete-word']
for (let i = 0; i < 36; i++) {
  const base = i % 3 === 0 ? sentence() : i % 3 === 1 ? logLine(i) : record(i)
  add(base, edit(base, { type: types[i % 6], count: 1 + (i % 4) }))
}
for (let i = 0; i < 6; i++) { // a long text with several edits
  const base = paragraph(i < 3 ? 2 : 3).slice(0, 200)
  const kinds = [{ type: 'replace-word', count: 2 }, { type: 'insert-word', count: 1 }, { type: 'delete-word', count: 1 }, { type: 'typo', count: 2 }]
  add(base, kinds.reduce((s, k) => edit(s, k), base))
}
for (let i = 0; i < 5; i++) { // heavily rewritten strings
  const a = sentence(), b = sentence()
  add(a, b)
}
add('Hello, world!', 'Hello, world!')
add('abc', 'xyz')
add('', 'something new in here')
add('something old in here', '')
add('', '')
add('a', 'a')
add('a', 'b')
add('ab', 'ba')
add('日本語のテキスト', '日本のテキストです')
add('the quick brown fox jumps over the lazy dog', 'the lazy dog jumps over the quick brown fox')

// Longest common subsequence length of two strings, by dynamic programming.
const lcs = (a, b) => {
  const x = chars(a), y = chars(b)
  let prev = new Array(y.length + 1).fill(0)
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array(y.length + 1).fill(0)
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1])
    prev = cur
  }
  return prev[y.length]
}

export const cases = pairs.map(([a, b]) => ({ input: { a, b }, expected: { lenA: chars(a).length, lenB: chars(b).length, kept: lcs(a, b) } }))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: list of runs required`)
    for (const run of out) {
      assert.ok(Array.isArray(run) && run.length === 2 && ['=', '-', '+'].includes(run[0]) && Number.isInteger(run[1]) && run[1] > 0, `fixture ${i}: bad run ${JSON.stringify(run)}`)
    }
    const sum = (ops) => out.filter((r) => ops.includes(r[0])).reduce((n, r) => n + r[1], 0)
    assert.equal(sum(['=', '-']), expected.lenA, `fixture ${i}: first string length`)
    assert.equal(sum(['=', '+']), expected.lenB, `fixture ${i}: second string length`)
    assert.equal(sum(['=']), expected.kept, `fixture ${i}: kept characters must equal the longest common subsequence`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
