import { strict as assert } from 'node:assert'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(2718)
const pick = (list) => list[Math.floor(r() * list.length)]
const tree = []
const marker = 'package.json'
const manifest = (path) => tree.push({ path, content: `{"name":"${path.replace(/[^a-z0-9]+/gi, '-')}","version":"1.0.0"}\n` })
const file = (path) => tree.push({ path, content: `// ${path}\n` })
// Things that look like the marker and are not it.
const decoys = (dir) => { file(`${dir}/package.json.bak`); file(`${dir}/package-lock.json`); file(`${dir}/my-package.json`); file(`${dir}/package.jsonc`) }

// repo: a monorepo. The root and five of its six packages have a package.json;
// pkg-03 has none, so its directories resolve to the root. tools and docs have none.
manifest('repo/package.json'); decoys('repo')
for (let p = 0; p < 6; p++) {
  const pkg = `repo/packages/pkg-${String(p).padStart(2, '0')}`
  file(`${pkg}/README.md`)
  if (p !== 3) { manifest(`${pkg}/package.json`); if (p % 2 === 0) decoys(pkg) }
  for (let m = 0; m < 4; m++) {
    const dir = `${pkg}/src/${pick(['core', 'ui', 'data', 'util'])}-${m}`
    for (let f = 0; f < 6 + Math.floor(r() * 10); f++) file(`${dir}/${pick(['index', 'view', 'model', 'types'])}-${f}.ts`)
    if (m % 2 === 0) for (let f = 0; f < 3; f++) file(`${dir}/__tests__/deep/case-${f}.test.ts`)
  }
  tree.push({ path: `${pkg}/dist/empty/` })
}
for (let f = 0; f < 10; f++) { file(`repo/tools/scripts/build/step-${f}.mjs`); file(`repo/docs/guide/part-${f}.md`) }
file('repo/.github/workflows/ci.yml')
// A package nested inside a package, three levels down.
manifest('repo/packages/pkg-01/examples/basic/package.json'); file('repo/packages/pkg-01/examples/basic/src/main.ts')

// deep: a chain of 30 directories with a package.json at the top, at level 9
// and at level 19.
let chain = 'deep'; manifest('deep/package.json')
for (let level = 0; level < 30; level++) {
  chain += `/d${String(level).padStart(2, '0')}`
  for (let f = 0; f < 3; f++) file(`${chain}/note-${f}.txt`)
  if (level === 9 || level === 19) manifest(`${chain}/package.json`)
}

// wide: three levels, each with 300 files, the package.json at the top.
manifest('wide/package.json')
for (const dir of ['wide', 'wide/a', 'wide/a/b', 'wide/a/b/c'])
  for (let f = 0; f < 300; f++) file(`${dir}/record-${String(f).padStart(4, '0')}.json`)

// names: a dot directory, a space and non-ASCII names.
manifest('names/package.json'); manifest('names/ünï cödé/package.json'); manifest('names/.hidden/package.json'); manifest('names/with space/package.json')
file('names/ünï cödé/with space/日本語/.cache/x.txt'); file('names/ünï cödé/café/résumé/notes.md')
file('names/.hidden/.config/sub/y.txt'); file('names/with space/a b/c d/e f/z.txt'); file('names/loose/orphan/w.txt')
manifest('names/loose/package.json')

export const files = { tree }

// Every directory of the tree (parents of every entry), sorted.
const directories = (() => {
  const found = new Set()
  for (const entry of tree) {
    const parts = entry.path.replace(/\/$/, '').split('/')
    const stop = entry.path.endsWith('/') ? parts.length : parts.length - 1
    for (let i = 1; i <= stop; i++) found.add(parts.slice(0, i).join('/'))
  }
  return [...found].sort()
})()
const markers = new Set(tree.filter((entry) => entry.path.endsWith('/' + marker)).map((entry) => entry.path))
// The nearest package.json at or above a directory, from the tree itself.
function nearest(dir) {
  for (let parts = dir.split('/'); parts.length; parts.pop()) {
    const candidate = `${parts.join('/')}/${marker}`
    if (markers.has(candidate)) return candidate
  }
  throw new Error(`no ${marker} above ${dir}`)
}
// Every directory below a root: the starts are all of them, except for large
// trees, where every second one is taken (the deepest are kept).
const startsFor = (root, step) => directories.filter((dir) => dir.startsWith(root + '/') || dir === root).filter((dir, i) => i % step === 0 || dir.split('/').length >= 6)

const roots = [['repo', 3], ['deep', 1], ['wide', 1], ['names', 1]]
export const cases = roots.map(([root, step]) => {
  const starts = startsFor(root, step)
  return { input: { starts: starts.map((dir) => `${scratch}/${dir}`) }, expected: starts.map(nearest) }
})

// A result is a list with one path per start, in the order of the starts: the
// absolute path of the package.json found. Nothing else is forgiven.
function check({ input, expected }, result, i) {
  assert.ok(Array.isArray(result), `fixture ${i}: a list of paths is required`)
  assert.equal(result.length, expected.length, `fixture ${i}: ${result.length} results, expected ${expected.length}`)
  for (let j = 0; j < expected.length; j++) {
    assert.equal(typeof result[j], 'string', `fixture ${i}: result ${j} must be a path string`)
    assert.equal(result[j], `${scratch}/${expected[j]}`, `fixture ${i}: start ${input.starts[j].slice(scratch.length + 1)}`)
  }
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, outputs[i], i))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
