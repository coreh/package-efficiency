import { strict as assert } from 'node:assert'
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(4711)
const words = ['alpha', 'beta', 'gamma', 'delta', 'café', 'naïve', '日本語', 'ünï', 'x']
const text = (length) => { let s = ''; while (s.length < length) s += words[Math.floor(r() * words.length)] + (r() < 0.2 ? '\n' : ' '); return s.slice(0, length) }

// Every file exists with old contents and is to be replaced by new ones.
// `tree` is what the harness creates; `replacement` is what each call writes
// (the same bytes on every call).
const tree = []
const replacement = new Map()
const add = (path, size, mode) => {
  tree.push({ path, content: `old contents of ${path}\n`, ...(mode ? { mode } : {}) })
  replacement.set(path, size === 0 ? '' : text(size))
}
const dirs = ['src', 'src/lib', 'docs/café', 'docs/日本語', 'config', 'a dir with spaces', '.hidden']
for (let d = 0; d < dirs.length; d++) for (let f = 0; f < 15; f++) add(`small/${dirs[d]}/file-${f}.txt`, 100 + Math.floor(r() * 8000), f === 3 ? 0o755 : f === 7 ? 0o600 : 0)
add('small/empty.txt', 0)
add('small/.env', 90, 0o600)
add('small/run.sh', 60, 0o755)
add('small/dir with spaces.txt', 40)
add('small/naïve-ünï.txt', 40)
add('small/a/b/c/d/e/deep.txt', 700)
add('small/zero-to-text.txt', 12)
add('small/read-only-group.txt', 300, 0o640)
for (let f = 0; f < 8; f++) add(`large/blob-${f}.txt`, 262144 + f * 17, f === 2 ? 0o600 : f === 5 ? 0o755 : 0)
const modeOf = (path) => tree.find((entry) => entry.path === path).mode ?? 0o644

export const files = { tree }
// One case per group; each replaces its own files. `mode` is the permission
// bits the file has (and must keep); adapters for APIs that demand one use it.
export const cases = ['small', 'large'].map((name) => ({
  input: { files: tree.filter((e) => e.path.startsWith(name + '/')).map((e) => ({ path: `${scratch}/${e.path}`, content: replacement.get(e.path), mode: modeOf(e.path) })) },
  expected: null,
}))

function listing(root) {
  const found = new Map()
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir)) {
      const full = `${dir}/${name}`, relative = prefix + name, stat = lstatSync(full)
      if (stat.isDirectory()) { found.set(relative + '/', null); walk(full, relative + '/') }
      else found.set(relative, { file: stat.isFile(), mode: stat.mode & 0o777, content: readFileSync(full) })
    }
  }
  walk(root, '')
  return found
}
// After the call: every file holds the new bytes, a regular file with the
// permission bits it had, and the directories hold nothing else (no temporary
// file left behind).
function check(c, i) {
  const name = i === 0 ? 'small' : 'large'
  const mine = tree.filter((e) => e.path.startsWith(name + '/'))
  const directories = new Set()
  for (const e of mine) for (let parts = e.path.slice(name.length + 1).split('/'), n = parts.length - 1; n > 0; n--) directories.add(parts.slice(0, n).join('/') + '/')
  let found
  try { found = listing(`${scratch}/${name}`) } catch (error) { assert.fail(`fixture ${i}: the directory cannot be read: ${error.message}`) }
  const wanted = [...directories, ...mine.map((e) => e.path.slice(name.length + 1))].sort()
  assert.deepEqual([...found.keys()].sort(), wanted, `fixture ${i}: the directories must hold exactly the declared files (no temporary file left)`)
  for (const e of mine) {
    const file = found.get(e.path.slice(name.length + 1))
    assert.ok(file.file, `fixture ${i}: ${e.path} must be a regular file`)
    assert.ok(Buffer.from(replacement.get(e.path)).equals(file.content), `fixture ${i}: ${e.path} does not hold the new bytes`)
    assert.equal(file.mode.toString(8), modeOf(e.path).toString(8), `fixture ${i}: permission bits of ${e.path}`)
  }
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, i))
}
export const verify = (operation) => cases.forEach((c, i) => { operation(c.input); check(c, i) })
export const consume = () => 1
