import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo', 'naïve 😀']
const quoted = ['hello world', 'a # not a comment', 'tab\tstays', 'it is = fine', 'https://example.com/a?b=c&d=e', 'café au lait', '']
// Builds one .env text and the pairs a correct parser returns. No variable
// references, escape sequences or multi-line values: parsers differ there.
const build = (n, size) => {
  const lines = ['# Generated settings for service ' + n, '']
  const expected = {}
  const add = (key, value, raw) => { lines.push(`${key}=${raw}`); expected[key] = value }
  for (let j = 0; j < size; j++) {
    const key = `${['APP', 'DB', 'CACHE', 'AUTH', 'LOG'][j % 5]}_${['HOST', 'PORT', 'NAME', 'TOKEN', 'MODE', 'URL'][j % 6]}_${j}`
    const v = words[(n + j) % words.length]
    switch (j % 8) {
      case 0: add(key, `host-${n}-${j}.example.com`, `host-${n}-${j}.example.com`); break
      case 1: add(key, String(1000 + n * j), String(1000 + n * j)); break
      case 2: { const q = quoted[(n + j) % quoted.length]; add(key, q, `"${q}"`); break }
      case 3: { const q = quoted[(n + j) % quoted.length]; add(key, q, `'${q}'`); break }
      case 4: add(key, '', ''); break
      case 5: add(key, `${v.replace(/ /g, '_')}-${j}`, `${v.replace(/ /g, '_')}-${j} # trailing comment`); break
      case 6: lines.push(`# section ${j}`); lines.push(''); add(key, `token_${n}_${j}_abcdef0123456789`, `token_${n}_${j}_abcdef0123456789`); break
      default: add(key, `postgres://user${j}:pw${n}@db.example.com:5432/app_${n}`, `postgres://user${j}:pw${n}@db.example.com:5432/app_${n}`)
    }
  }
  return { text: lines.join('\n') + '\n', expected }
}
const make = (n) => { const { text, expected } = build(n, n === 39 ? 160 : 4 + (n * 7) % 60); return { input: text, expected } }
export const cases = Array.from({ length: 40 }, (_, i) => make(i))
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out !== null && typeof out === 'object' && !Array.isArray(out), `fixture ${i}: map required`)
    assert.deepStrictEqual(Object.fromEntries(Object.entries(out)), expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Object.keys(value).length
