import { strict as assert } from 'node:assert'
// Independent two-row dynamic-programming oracle.
const reference = (a, b) => {
  const x = [...a], y = [...b]
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j)
  for (let i = 1; i <= x.length; i++) {
    const cur = [i]
    for (let j = 1; j <= y.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[y.length]
}
const closest = (query, list) => {
  let best = 0, bd = Infinity
  list.forEach((w, i) => { const d = reference(query, w); if (d < bd) { bd = d; best = i } })
  return best
}
let seed = 98765431
const next = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor((seed / 4294967296) * n) }
const vocabulary = ['install', 'uninstall', 'update', 'upgrade', 'remove', 'init', 'build', 'bundle', 'test', 'watch', 'serve', 'deploy', 'publish', 'login', 'logout', 'config', 'cache', 'clean', 'lint', 'format', 'verbose', 'version', 'help', 'output', 'input', 'directory', 'filename', 'timeout', 'retries', 'concurrency', 'production', 'development', 'staging', 'registry', 'workspace', 'dependency', 'devDependency', 'peerDependency', 'lockfile', 'manifest', 'template', 'compile', 'transpile', 'minify', 'sourcemap', 'coverage', 'snapshot', 'benchmark', 'profile', 'debug', 'trace', 'inspect', 'restart', 'status', 'diff', 'merge', 'rebase', 'checkout', 'branch', 'commit', 'stash', 'fetch', 'pull', 'push', 'clone', 'résumé', 'café', 'naïve', 'señal', 'über', 'crème', 'jalapeño', 'façade', 'coöperate', 'dépôt', 'último', 'größe']
const ascii = vocabulary.filter((w) => /^[\x00-\x7f]+$/.test(w))
const accented = vocabulary.filter((w) => !/^[\x00-\x7f]+$/.test(w))
const letters = 'abcdefghijklmnopqrstuvwxyz'
const typo = (w) => {
  const c = [...w]
  const pos = next(c.length)
  switch (next(5)) {
    case 0: c.splice(pos, 1); break
    case 1: c.splice(pos, 0, c[pos]); break
    case 2: if (pos + 1 < c.length) [c[pos], c[pos + 1]] = [c[pos + 1], c[pos]]; else c[pos] = letters[next(26)]; break
    case 3: c[pos] = letters[next(26)]; break
    default: c.splice(pos, 0, letters[next(26)]); break
  }
  return c.join('')
}
const pick = (pool, n) => {
  const copy = pool.slice(), out = []
  while (out.length < n && copy.length) out.push(copy.splice(next(copy.length), 1)[0])
  return out
}
const inputs = []
for (let i = 0; i < 40; i++) {
  const size = 25 + next(46)
  const withAccents = i % 4 === 3
  const list = pick(withAccents ? vocabulary : ascii, size)
  const target = list[next(list.length)]
  let query
  switch (i % 8) {
    case 0: query = target; break
    case 1: query = typo(typo(target)); break
    case 2: query = pick(ascii, 1)[0].slice(0, 2 + next(3)) + letters[next(26)]; break
    case 3: query = typo(target); break
    case 4: query = 'zzqx' + letters[next(26)] + 'kvw'.repeat(1 + next(4)); break
    case 5: query = typo(typo(typo(target))); break
    default: query = typo(target); break
  }
  inputs.push([query.slice(0, 18), list])
}
// A guaranteed tie: both candidates are one edit from the query; first must win.
inputs[5] = ['cat', ['dog', 'cut', 'cot', 'cap', 'horse', 'mouse']]
inputs[6] = ['instal', ['uninstall', 'install', 'installs', 'reinstall', 'update']]
export const cases = inputs.map((input) => ({ input, expected: closest(input[0], input[1]) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'number', `fixture ${i}: number required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
  assert.ok(new Set(cases.map((c) => c.expected)).size >= 15, 'fixtures must have varied answers')
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value
