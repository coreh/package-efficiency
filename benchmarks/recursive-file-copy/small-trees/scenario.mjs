import { strict as assert } from 'node:assert'
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(90210)
const bytes = (length) => Uint8Array.from({ length }, () => Math.floor(r() * 256))
const text = (length) => Array.from({ length: Math.ceil(length / 8) }, (_, i) => `line ${String(i).padStart(2, '0')}\n`).join('').slice(0, length)
const tree = []

// project: 300 small text files (0 to 4 KB) in nested directories, with an
// empty file, an empty directory, dot files, names that are not ASCII, and
// files that are executable or private.
for (let d = 0; d < 20; d++) {
  const dir = `project/src/${['core', 'ui', 'data', 'util'][d % 4]}/part-${d}`
  for (let f = 0; f < 14; f++) tree.push({ path: `${dir}/file-${f}.ts`, content: text(Math.floor(r() * 4096)) })
}
for (let f = 0; f < 6; f++) tree.push({ path: `project/bin/tool-${f}.sh`, content: `#!/bin/sh\necho ${f}\n`, mode: 0o755 })
for (let f = 0; f < 4; f++) tree.push({ path: `project/secrets/key-${f}.pem`, content: text(1700), mode: 0o600 })
tree.push({ path: 'project/.gitignore', content: 'dist\n' }, { path: 'project/.config/tool.json', content: '{}\n' })
tree.push({ path: 'project/docs/café/résumé.md', content: '# Résumé\n' }, { path: 'project/docs/日本語/はじめに.md', content: '# はじめに\n' })
tree.push({ path: 'project/a file with spaces.txt', content: 'spaces\n' }, { path: 'project/empty.txt', content: '' }, { path: 'project/dist/' })
for (let level = 0, dir = 'project/deep'; level < 6; level++) tree.push({ path: `${(dir += `/level-${level}`)}/note.txt`, content: text(200) })

// assets: 24 binary files of 64 to 192 KB, 3 MB in all.
for (let f = 0; f < 24; f++) tree.push({ path: `assets/${['images', 'fonts', 'media'][f % 3]}/blob-${f}.bin`, content: bytes(65536 + Math.floor(r() * 131072)) })

// Each case copies one source tree to its own destination, which does not
// exist when the operation starts: the harness removes both before every call.
export const files = { tree, reset: ['project-copy', 'assets-copy'] }
export const cases = ['project', 'assets'].map((name) => ({ input: { from: `${scratch}/${name}`, to: `${scratch}/${name}-copy` }, expected: null }))

// What must be at the destination: every directory, and every file with its
// bytes and permission bits. Read back from the disk here, never timed.
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
function check({ input }, i) {
  const name = input.from.slice(scratch.length + 1)
  const expected = tree.filter((entry) => entry.path.startsWith(name + '/')).map((entry) => ({ ...entry, path: entry.path.slice(name.length + 1) }))
  const directories = new Set()
  for (const entry of expected) for (let parts = entry.path.replace(/\/$/, '').split('/'), n = entry.path.endsWith('/') ? parts.length : parts.length - 1; n > 0; n--) directories.add(parts.slice(0, n).join('/') + '/')
  let found
  try { found = listing(input.to) } catch (error) { assert.fail(`fixture ${i}: the destination cannot be read: ${error.message}`) }
  const wanted = [...directories, ...expected.filter((entry) => !entry.path.endsWith('/')).map((entry) => entry.path)].sort()
  assert.deepEqual([...found.keys()].sort(), wanted, `fixture ${i}: the destination must hold exactly the files and directories of the source`)
  for (const entry of expected) {
    if (entry.path.endsWith('/')) continue
    const copy = found.get(entry.path)
    assert.ok(copy.file, `fixture ${i}: ${entry.path} must be a regular file`)
    assert.ok(Buffer.from(entry.content).equals(copy.content), `fixture ${i}: ${entry.path} differs from its source`)
    assert.equal(copy.mode.toString(8), (entry.mode ?? 0o644).toString(8), `fixture ${i}: permission bits of ${entry.path}`)
  }
}
// An operation returns nothing that counts: its result is on the disk. The
// runners of the other languages report here while their process waits, with
// every case's destination still in place.
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, i))
}
export const verify = (operation) => cases.forEach((c, i) => { operation(c.input); check(c, i) })
export const consume = () => 1
