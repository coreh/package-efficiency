import { strict as assert } from 'node:assert'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(7731)
const pick = (list) => list[Math.floor(r() * list.length)]
const tree = []
const file = (path) => tree.push({ path, content: `// ${path}\n` })

// app: a source project. 10 packages, each with nested source, test and
// documentation directories of uneven size, dot files and a dot directory.
const exts = ['ts', 'ts', 'ts', 'tsx', 'js', 'json', 'css', 'md']
file('app/package.json'); file('app/README.md'); file('app/.gitignore'); file('app/.env'); file('app/.eslintrc.json')
file('app/.config/settings.json'); file('app/.config/tools.json'); file('app/.github/workflows/ci.yml')
file('app/a file with spaces.txt'); file('app/notes.txt')
file('app/docs/café/résumé.md'); file('app/docs/日本語/はじめに.md'); file('app/docs/guide/intro.md')
tree.push({ path: 'app/empty/' })
for (let p = 0; p < 10; p++) {
  const pkg = `app/packages/pkg-${String(p).padStart(2, '0')}`
  file(`${pkg}/package.json`); file(`${pkg}/README.md`); file(`${pkg}/.gitignore`); file(`${pkg}/.config/settings.json`)
  for (let m = 0; m < 6; m++) {
    const dir = `${pkg}/src/${pick(['core', 'ui', 'data', 'util', 'net'])}-${m}`
    const count = 12 + Math.floor(r() * 36)
    for (let f = 0; f < count; f++) file(`${dir}/${pick(['index', 'view', 'model', 'helper', 'types', 'state'])}-${f}.${pick(exts)}`)
    if (m % 3 === 0) {
      for (let f = 0; f < 10; f++) file(`${dir}/test/unit-${f}.spec.${f % 3 === 0 ? 'js' : 'ts'}`)
      for (let f = 0; f < 4; f++) file(`${dir}/test/fixture-${f}.json`)
      file(`${dir}/test/.eslintrc.json`)
    }
    if (m % 2 === 0) for (let f = 0; f < 6; f++) file(`${dir}/.cache/entry-${f}.js`)
    if (m % 6 === 0) for (let f = 0; f < 6; f++) file(`${dir}/internal/detail/impl-${f}.ts`)
  }
  for (let f = 0; f < 8; f++) file(`${pkg}/docs/guide/chapter-${f}.md`)
  for (let f = 0; f < 3; f++) file(`${pkg}/docs/notes-${f}.txt`)
  tree.push({ path: `${pkg}/dist/` })
}
for (let m = 0; m < 5; m++) for (let f = 0; f < 16; f++) file(`app/src/${['core', 'ui', 'data', 'util', 'net'][m]}/${pick(['index', 'view', 'model', 'helper'])}-${f}.${pick(exts)}`)

// wide: few directories, many entries in each.
for (let d = 0; d < 3; d++) for (let f = 0; f < 400; f++) file(`wide/batch-${d}/record-${String(f).padStart(4, '0')}.${f % 5 === 0 ? 'csv' : 'json'}`)

file('wide/batch-0/.hidden.json'); file('wide/.cache/record-0003.json')

// deep: one chain of 40 directories, a few files at each level.
let chain = 'deep'
for (let level = 0; level < 40; level++) {
  chain += `/l${String(level).padStart(2, '0')}`
  for (let f = 0; f < 4; f++) file(`${chain}/note-${f}.txt`)
  file(`${chain}/data.json`)
  if (level === 5) { file(`${chain}/.keep.txt`); file(`${chain}/.git/info.txt`) }
}

// modules: many small directories, as an installed dependency folder has.
for (let m = 0; m < 90; m++) {
  const name = m % 13 === 0 ? `modules/@scope-${m % 5}/lib-${m}` : `modules/lib-${m}`
  for (const top of ['package.json', 'index.js', 'index.d.ts', 'README.md', 'LICENSE']) file(`${name}/${top}`)
  for (let f = 0; f < 4 + (m % 9); f++) file(`${name}/lib/part-${f}.js`)
  if (m % 4 === 0) { file(`${name}/lib/util/a.js`); file(`${name}/lib/util/b.js`) }
  if (m % 7 === 0) file(`${name}/.npmignore`)
  if (m % 11 === 0) file(`${name}/.bin/cli.js`)
}

export const files = { tree }

// The patterns of each tree, relative to the tree's own root directory. Only what every library
// shares: `*`, `?`, `[a-m]`, and `**` as a whole path segment. Every pattern
// ends in a name that only files have, so no directory is ever matched.
const patterns = {
  app: [
    '**/*.ts', '**/*.js', 'src/**/*.tsx', '**/test/*.spec.*', 'packages/*/package.json', '**/index-?.ts',
    '**/[a-m]*.css', '**/*.md', '**/.gitignore', '.config/*.json', 'packages/*/.config/*.json', '**/*.json',
    'docs/*/*.md', '**/*.txt',
  ],
  wide: ['**/*.json', 'batch-1/*.csv', '**/record-00?3.json'],
  deep: ['**/*.txt', 'l00/l01/**/data.json', '**/l3?/note-1.txt'],
  modules: ['**/*.js', '**/package.json', '*/lib/*.js', '@scope-*/*/index.d.ts', '**/.npmignore'],
}
// The reference: a pattern is split into segments; `**` matches zero or more
// directories, `*` and `?` and `[..]` match inside one segment. A name that
// starts with a dot is matched only by a segment that itself starts with a
// literal dot; `*`, `?`, `[..]` and `**` never match it.
function toRegExp(pattern, dot) {
  const segments = pattern.split('/')
  let source = ''
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1
    if (segment === '**') {
      assert.ok(!last, 'a pattern may not end in **')
      source += dot ? '(?:[^/]+/)*' : '(?:[^./][^/]*/)*'
      return
    }
    const guard = !dot && !segment.startsWith('.') ? '(?!\\.)' : ''
    let part = ''
    for (let j = 0; j < segment.length; j++) {
      const c = segment[j]
      if (c === '*') part += '[^/]*'
      else if (c === '?') part += '[^/]'
      else if (c === '[') { const end = segment.indexOf(']', j); part += segment.slice(j, end + 1); j = end }
      else part += c.replace(/[.+^${}()|\\]/g, '\\$&')
    }
    source += guard + part + (last ? '' : '/')
  })
  return new RegExp(`^${source}$`, 'u')
}
const filesUnder = (root) => tree.filter((e) => !e.path.endsWith('/') && e.path.startsWith(root + '/')).map((e) => e.path.slice(root.length + 1))
const expand = (root, pattern, dot = false) => { const re = toRegExp(pattern, dot); return filesUnder(root).filter((p) => re.test(p)).sort() }

export const cases = Object.entries(patterns).map(([root, list]) => ({
  input: { root: `${scratch}/${root}`, patterns: list },
  expected: list.map((pattern) => expand(root, pattern)),
  // The same with names that start with a dot matched by wildcards too: the
  // other convention packages follow (see check).
  expectedDot: list.map((pattern) => expand(root, pattern, true)),
}))

// The fixtures must be able to tell the right answer from the common wrong
// ones: every pattern matches something, and for each tree some pattern would
// match more if dot names were allowed (so ignoring the dot rule fails).
cases.forEach(({ input, expected }, i) => {
  const root = Object.keys(patterns)[i]
  expected.forEach((list, j) => assert.ok(list.length > 0, `pattern ${input.patterns[j]} of ${root} matches nothing`))
  assert.ok(input.patterns.some((p, j) => expand(root, p, true).length > expected[j].length), `${root}: no pattern depends on the dot rule`)
})

// A result is one list of path strings for every pattern, in the order of the
// patterns. Each list may be in any order; a path may be absolute or relative
// to the root, with or without a leading `./`. Nothing else is forgiven: every
// matching file exactly once, and nothing that does not match.
// Packages follow one of two conventions for names that start with a dot:
// wildcards skip them (the shell's rule) or match them. Either is accepted,
// but one of them for every pattern of a fixture, never a mix.
function check(fixture, result, i) {
  try {
    checkAgainst(fixture, fixture.expected, result, i)
  } catch (shellRule) {
    try {
      checkAgainst(fixture, fixture.expectedDot, result, i)
    } catch {
      throw shellRule
    }
  }
}
function checkAgainst({ input }, expected, result, i) {
  assert.ok(Array.isArray(result), `fixture ${i}: a list of results is required`)
  assert.equal(result.length, input.patterns.length, `fixture ${i}: one list per pattern is required`)
  result.forEach((list, j) => {
    assert.ok(Array.isArray(list), `fixture ${i}, pattern ${j}: a list of paths is required`)
    const seen = list.map((item) => {
      assert.equal(typeof item, 'string', `fixture ${i}, pattern ${j}: every path must be a string`)
      const relative = item.startsWith(input.root + '/') ? item.slice(input.root.length + 1) : item
      return relative.replace(/^(?:\.\/)+/, '')
    }).sort()
    assert.equal(seen.length, expected[j].length, `fixture ${i}, pattern ${input.patterns[j]}: ${seen.length} paths, expected ${expected[j].length}`)
    for (let k = 0; k < seen.length; k++) assert.equal(seen[k], expected[j][k], `fixture ${i}, pattern ${input.patterns[j]}: path ${k} of the sorted list`)
  })
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, outputs[i], i))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.length
