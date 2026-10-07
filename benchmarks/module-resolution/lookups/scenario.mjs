import { strict as assert } from 'node:assert'
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
const tree = []
const file = (path, content = `// ${path}\n`) => tree.push({ path, content })
const pkg = (dir, json, files) => {
  file(`${dir}/package.json`, JSON.stringify({ name: dir.split('node_modules/').pop(), version: '1.0.0', ...json }, null, 2) + '\n')
  for (const f of files) file(`${dir}/${f}`)
}
const P = 'proj'

// project sources
for (const f of ['src/app.js', 'src/util.js', 'src/data.json', 'src/lib/index.js', 'src/lib/helpers.js', 'src/lib/deep/a/b/c/leaf.js', 'src/widget/index.js', 'src/widget/style.json', 'src/with-ext.mjs', 'test/spec.js', 'test/fixtures/sample.json'])
  file(`${P}/${f}`)
pkg(`${P}/src/local-pkg`, { main: './lib/entry' }, ['lib/entry.js'])
file(`${P}/src/dotdir.d/index.js`)

// project dependencies: a mix of shapes
for (let i = 0; i < 30; i++) pkg(`${P}/node_modules/plain-${i}`, {}, ['index.js', 'lib/inner.js'])
for (let i = 0; i < 20; i++) pkg(`${P}/node_modules/main-${i}`, { main: i % 2 ? 'dist/main.js' : './lib/start' }, ['dist/main.js', 'lib/start.js', 'index.js'])
for (let i = 0; i < 6; i++) pkg(`${P}/node_modules/@scope-${i}/core`, { main: 'build/index.js' }, ['build/index.js', 'build/extra.js'])
pkg(`${P}/node_modules/json-only`, { main: 'config' }, ['config.json'])
pkg(`${P}/node_modules/dir-main`, { main: 'lib' }, ['lib/index.js'])
pkg(`${P}/node_modules/bad-main`, { main: 'missing.js' }, ['index.js'])
pkg(`${P}/node_modules/no-main`, {}, ['index.js'])
file(`${P}/node_modules/single.js`)
file(`${P}/node_modules/plain-3/lib/inner.json`, '{}\n')
// nested node_modules, nearer than the top one
pkg(`${P}/src/node_modules/plain-1`, {}, ['index.js'])
pkg(`${P}/src/lib/node_modules/near`, { main: 'near.js' }, ['near.js'])
pkg(`${P}/src/lib/node_modules/near/node_modules/far`, {}, ['index.js'])
pkg(`${P}/test/node_modules/test-only`, {}, ['index.js'])

export const files = { tree }

const at = (rel) => `${scratch}/${P}/${rel}`
const sets = [
  { base: 'src', specs: [
    ['./util', 'src/util.js'], ['./util.js', 'src/util.js'], ['./data', 'src/data.json'], ['./lib', 'src/lib/index.js'],
    ['./lib/', 'src/lib/index.js'], ['./lib/helpers', 'src/lib/helpers.js'], ['./widget', 'src/widget/index.js'], ['./widget/style', 'src/widget/style.json'],
    ['./local-pkg', 'src/local-pkg/lib/entry.js'], ['./with-ext.mjs', 'src/with-ext.mjs'], ['./dotdir.d', 'src/dotdir.d/index.js'],
    ['../test/spec', 'test/spec.js'], ['../test/fixtures/sample', 'test/fixtures/sample.json'], ['./lib/deep/a/b/c/leaf', 'src/lib/deep/a/b/c/leaf.js'],
    ['plain-1', 'src/node_modules/plain-1/index.js'], ['plain-2', 'node_modules/plain-2/index.js'], ['plain-3/lib/inner', 'node_modules/plain-3/lib/inner.js'],
    ['main-0', 'node_modules/main-0/lib/start.js'], ['main-1', 'node_modules/main-1/dist/main.js'], ['main-7/index', 'node_modules/main-7/index.js'],
  ] },
  { base: 'src/lib/deep/a/b/c', specs: [
    ['./leaf', 'src/lib/deep/a/b/c/leaf.js'], ['../../../../helpers', 'src/lib/helpers.js'], ['../../../..', 'src/lib/index.js'],
    ['near', 'src/lib/node_modules/near/near.js'], ['plain-1', 'src/node_modules/plain-1/index.js'],
    ['plain-9', 'node_modules/plain-9/index.js'], ['main-12', 'node_modules/main-12/lib/start.js'], ['@scope-2/core', 'node_modules/@scope-2/core/build/index.js'],
    ['@scope-5/core/build/extra', 'node_modules/@scope-5/core/build/extra.js'], ['json-only', 'node_modules/json-only/config.json'], ['dir-main', 'node_modules/dir-main/lib/index.js'],
    ['bad-main', 'node_modules/bad-main/index.js'], ['single', 'node_modules/single.js'], ['no-main', 'node_modules/no-main/index.js'],
  ] },
  { base: 'test/fixtures', specs: [
    ['../spec', 'test/spec.js'], ['./sample.json', 'test/fixtures/sample.json'], ['test-only', 'test/node_modules/test-only/index.js'],
    ['plain-0', 'node_modules/plain-0/index.js'], ['plain-29', 'node_modules/plain-29/index.js'], ['plain-17/lib/inner', 'node_modules/plain-17/lib/inner.js'],
    ['main-19', 'node_modules/main-19/dist/main.js'], ['main-18/package.json', 'node_modules/main-18/package.json'], ['@scope-0/core', 'node_modules/@scope-0/core/build/index.js'],
    ['@scope-1/core', 'node_modules/@scope-1/core/build/index.js'], ['@scope-3/core/package.json', 'node_modules/@scope-3/core/package.json'],
    ['plain-3/lib/inner.json', 'node_modules/plain-3/lib/inner.json'], ['../../src/widget', 'src/widget/index.js'],
  ] },
  { base: 'src/widget', specs: [
    ['.', 'src/widget/index.js'], ['./index', 'src/widget/index.js'], ['./style', 'src/widget/style.json'],     ['../util', 'src/util.js'], ['../lib', 'src/lib/index.js'], ['plain-1', 'src/node_modules/plain-1/index.js'], ['plain-4', 'node_modules/plain-4/index.js'],
    ['main-5', 'node_modules/main-5/dist/main.js'], ['main-6', 'node_modules/main-6/lib/start.js'], ['@scope-4/core', 'node_modules/@scope-4/core/build/index.js'],
    ['plain-12/package.json', 'node_modules/plain-12/package.json'], ['dir-main/lib', 'node_modules/dir-main/lib/index.js'],
  ] },
]
export const cases = sets.map(({ base, specs }) => ({
  input: { base: at(base), specifiers: specs.map(([s]) => s) },
  expected: specs.map(([, rel]) => at(rel)),
}))

// The result is a list of absolute paths, one per specifier, in the order of
// the specifiers. Nothing else is forgiven: each must be the exact file.
function check({ expected }, result, i) {
  assert.ok(Array.isArray(result), `fixture ${i}: a list of paths is required`)
  assert.equal(result.length, expected.length, `fixture ${i}: ${result.length} paths, expected ${expected.length}`)
  for (let j = 0; j < expected.length; j++) {
    assert.equal(typeof result[j], 'string', `fixture ${i}: entry ${j} must be a path string`)
    assert.equal(result[j], expected[j], `fixture ${i}: specifier ${j}`)
  }
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, outputs[i], i))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
