import { strict as assert } from 'node:assert'
// Each input is { line: string }, a POSIX shell command line. A correct result is the
// list of argument words after quote removal and escape processing.
// Every fixture is built from its expected words, so the answer is known by construction.
// Unquoted metacharacters, $, `, # and ~ never appear outside single or double quotes, and
// double quotes only escape " and \, so every package agrees on the meaning.
const plain = ['ls', 'git', 'commit', '-m', '--verbose', '--output=build/out.txt', 'src/main.rs', 'node_modules/.bin/tsc', 'data-2026.csv', 'x', '42', 'a=b', 'é', 'données.txt', '日本語']
const spaced = ['my file.txt', 'hello world', 'Fix: handle the empty case', 'two  spaces', 'tab\there', '/Users/jane doe/Documents', 'ünï cödé text', 'a b c d e f']
const quoted = ["it's", "don't panic", 'say "hi"', 'both \' and "', 'back\\slash', 'C:\\Program Files\\App', '"', "'", '\\', '\\"', 'trailing\\']
const meta = ['a|b', 'x && y', '$HOME', '${PATH}', '`date`', '# not a comment', '*.js', 'file?.txt', 'a;b', '<in >out', '(sub)', '~/x', '!bang', 'price: $5', '{a,b}']
const pools = [plain, spaced, quoted, meta]
const hasSpace = (w) => /[ \t]/.test(w)
const safe = (w) => /^[A-Za-z0-9_\-./=+,:@%é日本語]+$/u.test(w)
const single = (w) => w.includes("'") ? null : `'${w}'`
const double = (w) => /[$`!]/.test(w) ? null : `"${w.replace(/(["\\])/g, '\\$1')}"`
const slashed = (w) => /[|&;<>()$`#*?~!{}]/.test(w) || /[\n]/.test(w) ? null : w.replace(/([ \t"'\\])/g, '\\$1')
// Quote one word in one of several styles, picking another style when the first cannot hold it.
const quote = (w, style) => {
  if (w === '') return style % 2 ? "''" : '""'
  const order = [[w, single, double, slashed], [single, double, slashed], [double, single, slashed], [slashed, single, double]][style % 4]
  for (const q of order) {
    const r = typeof q === 'string' ? (safe(q) ? q : null) : q(w)
    if (r !== null) return r
  }
  throw new Error(`cannot quote ${w}`)
}
// Join the word in two quoted pieces, as in 'ab'"cd"ef, which is still one word.
const concat = (w, style) => {
  const cut = (style % 3) + 1
  if ([...w].length < 3 || [...w].length <= cut) return null
  const chars = [...w]
  const a = chars.slice(0, cut).join(''), b = chars.slice(cut).join('')
  const qa = quote(a, style), qb = quote(b, style + 1)
  return qa + qb
}
const seps = [' ', ' ', '  ', ' ', '   ', ' \t ']
const build = (i) => {
  const n = 1 + (i * 7) % 9
  const words = []
  const pieces = []
  for (let k = 0; k < n; k++) {
    const pool = pools[(i + k * 3 + (k === 0 ? 0 : 1)) % (k === 0 ? 2 : 4)]
    const w = pool[(i * 5 + k * 11) % pool.length]
    const style = i + k * 2
    const c = k % 4 === 3 ? concat(w, style) : null
    words.push(w)
    pieces.push(c ?? quote(w, style))
  }
  let line = pieces.map((p, k) => (k ? seps[(i + k) % seps.length] : '') + p).join('')
  if (i % 5 === 2) line = '  ' + line
  if (i % 7 === 3) line += ' '
  return { input: { line }, expected: words }
}
export const cases = Array.from({ length: 52 }, (_, i) => build(i))
const extra = [
  ['', []],
  ['   ', []],
  ['echo hello', ['echo', 'hello']],
  ["echo 'a  b'  \"c  d\"  e\\ f", ['echo', 'a  b', 'c  d', 'e f']],
  ["grep -r 'don'\\''t' ./src", ['grep', '-r', "don't", './src']],
  ['printf "%s\\n" "say \\"hi\\""', ['printf', '%s\\n', 'say "hi"']],
  ["'a'\"b\"c'd'", ['abcd']],
  ['"" x', ['', 'x']].slice(0, 2),
  ["one 'two three' \"four five\" six\\ seven", ['one', 'two three', 'four five', 'six seven']],
]
for (const [line, expected] of extra.slice(0, 7)) cases.push({ input: { line }, expected })
cases.push({ input: { line: "tar -czf 'my archive.tar.gz' \"My Documents\" notes\\ final.txt" }, expected: ['tar', '-czf', 'my archive.tar.gz', 'My Documents', 'notes final.txt'] })
cases.push({ input: { line: extra[8][0] }, expected: extra[8][1] })
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(Array.isArray(out), `fixture ${i}: a list of words is required`)
    assert.ok(out.every((w) => typeof w === 'string'), `fixture ${i}: every word must be a string: ${JSON.stringify(out)}`)
    assert.deepEqual(out, expected, `fixture ${i}: ${input.line}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
