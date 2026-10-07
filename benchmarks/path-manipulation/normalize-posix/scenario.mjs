import { strict as assert } from 'node:assert'
// Independent reference: segment stack. Input is relative, '/' separated.
const reference = (path) => {
  const out = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop()
      else out.push('..')
    } else out.push(part)
  }
  return out.join('/')
}
// Accepted spellings: trailing slash, leading "./", and "" versus ".".
const canonical = (s) => {
  let r = s
  while (r.startsWith('./')) r = r.slice(2)
  r = r.replace(/\/+$/, '')
  return r === '.' ? '' : r
}
const names = ['src', 'lib', 'node_modules', 'my project', 'café', '日本語', '.hidden', 'a.b', '...', 'index.test.js', 'Δ', 'v1.2.3', 'x', 'packages', 'dist']
const pieces = ['/', '//', '///', './', '../', '/./', '/../', '/']
const generated = Array.from({ length: 52 }, (_, i) => {
  const count = 1 + (i * 7) % 9
  let s = ''
  for (let j = 0; j < count; j++) {
    const name = names[(i * 3 + j * 5) % names.length]
    const sep = pieces[(i + j * 2 + (j % 3)) % pieces.length]
    s += (j === 0 && i % 4 === 1 ? '../' : '') + name + sep
  }
  s += names[(i * 11) % names.length]
  if (i % 9 === 4) s += '/'
  if (i % 13 === 5) s = './' + s
  return s
})
const fixed = ['a/b/c', 'a/./b/../c', '../../a/b', 'a/b/../../..', 'a//b///c/', './', 'a/..', 'src/../lib/./index.js']
export const cases = [...generated, ...fixed].map((input) => ({ input, expected: canonical(reference(input)) }))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(canonical(outputs[i]), expected, `fixture ${i}: ${cases[i].input}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
