import { strict as assert } from 'node:assert'
export const patterns = [
  'src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json',
  'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml',
]
const roots = ['src', 'src/utils', 'src/components/button', 'src/components/form/fields', 'lib', 'lib/core', 'lib/core/internal',
  'docs', 'docs/guide', 'docs/api/v2', 'test', 'test/unit', 'src/__tests__', 'lib/__tests__/helpers', 'packages/core/src',
  'packages/cli/src/commands', 'packages/ui/src/hooks', 'packages/ui/dist', 'assets/img', 'assets/fonts', 'config', 'build/out',
  'node_modules/left-pad', 'node_modules/@scope/pkg/lib', 'scripts', '.', 'data/raw']
const names = ['index.js', 'index.ts', 'main.tsx', 'util.js', 'path.ts', 'README.md', 'guide.md', 'changelog.md', 'app.test.js',
  'app.test.ts', 'a.spec.ts', 'file-1.txt', 'file-2.txt', 'file-ab.txt', 'logo.png', 'photo.jpg', 'icon.svg', 'font.woff2',
  'data.json', 'package.json', 'tsconfig.json', 'app.yml', 'beta.yml', 'ci.yml', 'style.css', 'Makefile', 'setup.sh', 'readme']
const pool = []
for (const d of roots) for (const n of names) pool.push(d === '.' ? n : `${d}/${n}`)
// Independent oracle: translate to a regular expression.
const toRegExp = (g) => {
  let r = '', i = 0
  while (i < g.length) {
    const c = g[i]
    if (g.startsWith('**/', i)) { r += '(?:.*/)?'; i += 3 }
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
const regexes = patterns.map(toRegExp)
const oracle = (p) => regexes.some((re) => re.test(p))
const PATHS = 250
export const cases = Array.from({ length: 36 }, (_, k) => {
  const paths = Array.from({ length: PATHS }, (_, j) => pool[(k * 37 + j * 7 + (j % 5) * 13 + Math.floor(j / 11) * 3) % pool.length])
  const expected = paths.map(oracle)
  assert.ok(expected.some(Boolean) && expected.some((x) => !x), `fixture ${k} must mix matches and non-matches`)
  return { input: { paths }, expected }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array required`)
    assert.ok(outputs[i].every((x) => typeof x === 'boolean'), `fixture ${i}: booleans required`)
    assert.deepEqual(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
