import { strict as assert } from 'node:assert'
const dirs = ['src', 'src/utils', 'src/components/button', 'lib', 'lib/core', 'docs', 'docs/guide', 'test', 'test/unit', 'packages/core/src', 'packages/cli/src', 'assets/img', 'node_modules/left-pad', 'src/__tests__', 'build/out']
const names = ['index.js', 'index.ts', 'main.ts', 'util.js', 'path.ts', 'README.md', 'guide.md', 'app.test.js', 'app.test.ts', 'a.spec.ts', 'file-1.txt', 'file-2.txt', 'file-ab.txt', 'logo.png', 'photo.jpg', 'icon.svg', 'data.json', 'config.json', 'beta.json', 'style.css', 'café.md', 'readme']
const pool = []
for (const d of dirs) for (const n of names) pool.push(`${d}/${n}`)
for (const n of names) if (n.length % 2 === 0 || n.endsWith('.md')) pool.push(n)
const patterns = [
  '**/*.js', '**/*.ts', 'src/**/*.ts', '*.md', 'src/*.js', 'src/*/*.ts', 'src/**/*.test.js', '{src,lib}/**/*.{js,ts}',
  'docs/**/*', '**/node_modules/**/*', 'file-?.txt', '**/file-?.txt', '[a-c]*.json', '**/[a-c]*.json', 'packages/*/src/index.ts',
  '**/*.test.{js,ts}', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*.js', '**/*', '*', 'src/**/*', 'lib/core/index.js',
  '**/index.*', '**/*.{md,json}', 'test/**/*.js', 'packages/**/src/*.ts', '**/a.spec.ts', '*.{png,jpg}', '**/img/*', 'docs/*/*.md',
  '**/READM?.md', 'src/utils/*.[jt]s', '**/*[0-9].txt', 'build/**/*.css', '{docs,test}/**/*.md', '**/readme',
]
// Independent oracle: translate to a regular expression.
const toRegExp = (g) => {
  let r = '', i = 0
  while (i < g.length) {
    const c = g[i]
    if (g.startsWith('**/', i)) { r += '(?:.*/)?'; i += 3 }
    else if (g.startsWith('/**', i) && i + 3 === g.length) { r += '/.+'; i += 3 }
    else if (c === '*') { r += '[^/]*'; i++ }
    else if (c === '?') { r += '[^/]'; i++ }
    else if (c === '{') { r += '(?:'; i++ }
    else if (c === '}') { r += ')'; i++ }
    else if (c === ',') { r += '|'; i++ }
    else if (c === '[' || c === ']') { r += c; i++ }
    else { r += c.replace(/[.+^$()|\\]/g, '\\$&'); i++ }
  }
  return new RegExp(`^${r}$`, 'u')
}
// One compile per PATHS matches: enough paths that matching, not compiling, is most of a call.
const PATHS = 240
export const cases = patterns.map((pattern, k) => {
  const paths = Array.from({ length: PATHS }, (_, j) => pool[(k * 13 + j * 5 + (j % 3) * 11) % pool.length])
  // Make sure the list varies in what it contains and always has a likely match.
  const re = toRegExp(pattern)
  const hits = pool.filter((p) => re.test(p))
  paths[0] = hits.length ? hits[k % hits.length] : paths[0]
  paths[PATHS - 1] = hits.length ? hits[(k * 3 + 1) % hits.length] : paths[PATHS - 1]
  return { input: { pattern, paths }, expected: paths.map((p) => re.test(p)) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected, input }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array required`)
    assert.deepEqual(outputs[i].map((x) => x === true), expected, `fixture ${i}: ${input.pattern}`)
    assert.ok(outputs[i].every((x) => typeof x === 'boolean'), `fixture ${i}: booleans required`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
