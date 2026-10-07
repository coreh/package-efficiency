import { strict as assert } from 'node:assert'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(4242)
const pick = (list) => list[Math.floor(r() * list.length)]
const tree = []
const file = (path) => tree.push({ path, content: `// ${path}\n` })

// app: a source project. 12 packages, each with nested source, test and
// documentation directories of uneven size, dot files and a dot directory.
const exts = ['ts', 'ts', 'ts', 'tsx', 'js', 'json', 'css', 'md']
for (let p = 0; p < 12; p++) {
  const pkg = `app/packages/pkg-${String(p).padStart(2, '0')}`
  file(`${pkg}/package.json`); file(`${pkg}/README.md`); file(`${pkg}/.gitignore`); file(`${pkg}/.config/settings.json`)
  for (let m = 0; m < 6; m++) {
    const dir = `${pkg}/src/${pick(['core', 'ui', 'data', 'util', 'net'])}-${m}`
    const count = 12 + Math.floor(r() * 36)
    for (let f = 0; f < count; f++) file(`${dir}/${pick(['index', 'view', 'model', 'helper', 'types', 'state'])}-${f}.${pick(exts)}`)
    if (m % 3 === 0) for (let f = 0; f < 12; f++) file(`${dir}/__tests__/case-${f}.test.ts`)
    if (m % 6 === 0) for (let f = 0; f < 6; f++) file(`${dir}/internal/detail/impl-${f}.ts`)
  }
  for (let f = 0; f < 8; f++) file(`${pkg}/docs/guide/chapter-${f}.md`)
  tree.push({ path: `${pkg}/dist/` }) // an empty directory
}
file('app/docs/café/résumé.md'); file('app/docs/日本語/はじめに.md'); file('app/a file with spaces.txt'); file('app/.env')

// wide: few directories, many entries in each.
for (let d = 0; d < 3; d++) for (let f = 0; f < 400; f++) file(`wide/batch-${d}/record-${String(f).padStart(4, '0')}.json`)

// deep: one chain of 40 directories, a few files at each level.
let chain = 'deep'
for (let level = 0; level < 40; level++) {
  chain += `/l${String(level).padStart(2, '0')}`
  for (let f = 0; f < 4; f++) file(`${chain}/note-${f}.txt`)
}

// modules: many small directories, as an installed dependency folder has.
for (let m = 0; m < 90; m++) {
  const name = m % 13 === 0 ? `modules/@scope-${m % 5}/lib-${m}` : `modules/lib-${m}`
  for (const top of ['package.json', 'index.js', 'index.d.ts', 'README.md', 'LICENSE']) file(`${name}/${top}`)
  for (let f = 0; f < 4 + (m % 9); f++) file(`${name}/lib/part-${f}.js`)
  if (m % 4 === 0) { file(`${name}/lib/util/a.js`); file(`${name}/lib/util/b.js`) }
}

export const files = { tree }

// Everything below a root, files and directories, relative to it.
function below(root) {
  const found = new Set()
  for (const entry of tree) {
    if (!entry.path.startsWith(root + '/')) continue
    const parts = entry.path.slice(root.length + 1).replace(/\/$/, '').split('/')
    for (let i = 1; i <= parts.length; i++) found.add(parts.slice(0, i).join('/'))
  }
  return [...found].sort()
}
export const cases = ['app', 'wide', 'deep', 'modules'].map((root) => ({ input: { root: `${scratch}/${root}` }, expected: below(root) }))

// A result is a list of path strings, in any order. A path may be absolute or
// relative to the root, and a directory may end in a slash; the root itself
// may be listed or not. Nothing else is forgiven: every file and directory
// once, and nothing that is not there.
function check({ input, expected }, result, i) {
  assert.ok(Array.isArray(result), `fixture ${i}: a list of paths is required`)
  const seen = []
  for (const item of result) {
    assert.equal(typeof item, 'string', `fixture ${i}: every entry must be a path string`)
    let relative = item === input.root || item.startsWith(input.root + '/') ? item.slice(input.root.length) : item
    relative = relative.replace(/^\.?\/+/, '').replace(/\/+$/, '')
    if (relative !== '' && relative !== '.') seen.push(relative)
  }
  seen.sort()
  assert.equal(seen.length, expected.length, `fixture ${i}: ${seen.length} entries, expected ${expected.length}`)
  for (let j = 0; j < expected.length; j++) assert.equal(seen[j], expected[j], `fixture ${i}: entry ${j} of the sorted list`)
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, outputs[i], i))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
