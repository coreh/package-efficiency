import { strict as assert } from 'node:assert'
// Each input is { words: string[] }. A correct output is a string that a POSIX shell splits back into the same words.
const plain = ['ls', 'git', 'commit', '-m', '--verbose', '--output=build/out.txt', 'src/main.rs', 'node_modules/.bin/tsc', 'data-2026.csv', 'x', '42', 'a=b', 'é', 'données.txt', '日本語', 'v1.2.3', 'user@host:/srv']
const spaced = ['my file.txt', 'hello world', 'Fix: handle the empty case', 'two  spaces', 'tab\there', '/Users/jane doe/Documents', 'ünï cödé text', 'a b c d e f', ' leading', 'trailing ']
const quoted = ["it's", "don't panic", 'say "hi"', 'both \' and "', 'back\\slash', 'C:\\Program Files\\App', '"', "'", '\\', '\\"', 'trailing\\', '']
const meta = ['a|b', 'x && y', '$HOME', '${PATH}', '`date`', '# not a comment', '*.js', 'file?.txt', 'a;b', '<in >out', '(sub)', '~/x', 'price: $5', '{a,b}', '2>&1']
const pools = [plain, plain, spaced, quoted, meta]
const build = (i) => {
  const n = 1 + (i * 7) % 10
  const words = []
  for (let k = 0; k < n; k++) {
    const pool = k === 0 ? plain : pools[(i + k * 3) % pools.length]
    words.push(pool[(i * 5 + k * 11) % pool.length])
  }
  return words
}
export const cases = Array.from({ length: 60 }, (_, i) => ({ input: { words: build(i) } }))
// A small POSIX word splitter, used only by the verifier.
export const splitPosix = (line) => {
  const words = []
  let cur = null
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === ' ' || c === '\t' || c === '\n') { if (cur !== null) { words.push(cur); cur = null } continue }
    cur ??= ''
    if (c === '\\') { assert.ok(i + 1 < line.length, 'dangling backslash'); cur += line[++i] }
    else if (c === "'") { const j = line.indexOf("'", i + 1); assert.ok(j >= 0, 'unterminated single quote'); cur += line.slice(i + 1, j); i = j }
    else if (c === '"') {
      i++
      for (; i < line.length && line[i] !== '"'; i++) {
        if (line[i] === '\\' && '"\\$`\n'.includes(line[i + 1] ?? '')) i++
        cur += line[i]
      }
      assert.ok(i < line.length, 'unterminated double quote')
    } else cur += c
  }
  if (cur !== null) words.push(cur)
  return words
}
const needsQuoting = (w) => w === '' || /[^A-Za-z0-9_\-./=+,:@%é日本語]/u.test(w)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const out = outputs[i]
    assert.equal(typeof out, 'string', `fixture ${i}: a string is required`)
    assert.deepEqual(splitPosix(out), input.words, `fixture ${i}: ${out}`)
    // Not a bare join: any word needing quotes must make the output differ from the plain join.
    if (input.words.some(needsQuoting)) assert.notEqual(out, input.words.join(' '), `fixture ${i}: words were not quoted`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
