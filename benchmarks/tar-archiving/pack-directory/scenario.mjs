import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { lstatSync, readdirSync, readFileSync } from 'node:fs'
// The harness creates `files.tree` in the task's scratch directory before
// each adapter process starts, and names that directory in BENCH_FILES.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const r = rng(31337)
const bytes = (length) => Uint8Array.from({ length }, () => Math.floor(r() * 256))
const text = (length) => Array.from({ length: Math.ceil(length / 12) }, (_, i) => `entry ${String(i).padStart(4, '0')}\n`).join('').slice(0, length)
const tree = []

// project: 200 small text files (0 to 4 KB) in nested directories, with an
// empty file, an empty directory, dot files, a name with spaces, names that
// are not ASCII, a chain six directories deep, a path longer than the 100
// bytes of a plain tar name field, and files that are executable or private.
for (let d = 0; d < 16; d++) {
  const dir = `project/src/${['core', 'ui', 'data', 'util'][d % 4]}/part-${d}`
  for (let f = 0; f < 12; f++) tree.push({ path: `${dir}/file-${f}.ts`, content: text(Math.floor(r() * 4096)) })
}
for (let f = 0; f < 4; f++) tree.push({ path: `project/bin/tool-${f}.sh`, content: `#!/bin/sh\necho ${f}\n`, mode: 0o755 })
for (let f = 0; f < 3; f++) tree.push({ path: `project/secrets/key-${f}.pem`, content: text(1700), mode: 0o600 })
tree.push({ path: 'project/.gitignore', content: 'dist\n' }, { path: 'project/.config/tool.json', content: '{}\n' })
tree.push({ path: 'project/docs/café/résumé.md', content: '# Résumé\n' }, { path: 'project/docs/日本語/はじめに.md', content: '# はじめに\n' })
tree.push({ path: 'project/a file with spaces.txt', content: 'spaces\n' }, { path: 'project/empty.txt', content: '' }, { path: 'project/dist/' })
for (let level = 0, dir = 'project/deep'; level < 6; level++) tree.push({ path: `${(dir += `/level-${level}`)}/note.txt`, content: text(200) })
// 112 bytes below `project/` (114 with `./`): too long for the name field alone, short enough
// for the ustar prefix and name split, so every header flavour can hold it.
tree.push({ path: 'project/packages/some-long-package-name/node_modules/another-long-dependency-name/lib/internal/helpers/format-message.js', content: text(900) })

// assets: one file of exactly 1 MiB and 12 binary files of 32 to 160 KB.
tree.push({ path: 'assets/video/clip.bin', content: bytes(1 << 20) })
for (let f = 0; f < 12; f++) tree.push({ path: `assets/${['images', 'fonts', 'media'][f % 3]}/blob-${f}.bin`, content: bytes(32768 + Math.floor(r() * 131072)) })

// Each case packs one source tree into its own archive file and extracts
// that archive into its own destination. Neither exists when the operation
// starts (the harness removes all four before every call); the parent of
// each does.
const names = ['project', 'assets']
export const files = { tree, reset: names.flatMap((name) => [`${name}.tar`, `${name}-out`]) }
export const cases = names.map((name) => ({ input: { source: `${scratch}/${name}`, archive: `${scratch}/${name}.tar`, target: `${scratch}/${name}-out` }, expected: null }))

// The source tree of a case, relative to its root: files with their bytes and
// mode, the directories that must exist (every parent, and the empty one).
function expectedTree(name) {
  const entries = tree.filter((entry) => entry.path.startsWith(name + '/')).map((entry) => ({ ...entry, path: entry.path.slice(name.length + 1) }))
  const fileList = entries.filter((entry) => !entry.path.endsWith('/'))
  const directories = new Set()
  for (const entry of entries) for (let parts = entry.path.replace(/\/$/, '').split('/'), n = entry.path.endsWith('/') ? parts.length : parts.length - 1; n > 0; n--) directories.add(parts.slice(0, n).join('/') + '/')
  return { files: fileList, directories, empty: entries.filter((entry) => entry.path.endsWith('/')).map((entry) => entry.path) }
}
const expectedTrees = names.map(expectedTree)

// A strict reader for what a tar writer may produce here: ustar (with the
// prefix field), GNU (long names in `L` entries) and PAX (`path` in `x`
// records; `g` records skipped). It returns every entry as
// { path, type, content } with `./` and a trailing slash removed, and fails on
// a bad header checksum, a truncated archive or an unknown entry type.
const field = (block, start, length) => { const raw = block.subarray(start, start + length), end = raw.indexOf(0); return raw.subarray(0, end < 0 ? length : end) }
const octal = (block, start, length) => { const s = field(block, start, length).toString('latin1').trim(); assert.match(s, /^[0-7]+$/, `tar header: bad number ${JSON.stringify(s)}`); return parseInt(s, 8) }
export function readTar(archive) {
  const entries = []
  let offset = 0, longName = null, paxPath = null, ended = false
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512)
    if (header.every((b) => b === 0)) { ended = true; break }
    let sum = 0
    for (let k = 0; k < 512; k++) sum += k >= 148 && k < 156 ? 32 : header[k]
    assert.equal(octal(header, 148, 8), sum, `tar header at ${offset}: bad checksum`)
    const size = octal(header, 124, 12), type = String.fromCharCode(header[156] || 48)
    const body = archive.subarray(offset + 512, offset + 512 + size)
    assert.equal(body.length, size, `tar entry at ${offset}: truncated`)
    offset += 512 + Math.ceil(size / 512) * 512
    if (type === 'L') { longName = field(body, 0, size).toString('utf8'); continue }
    if (type === 'x') {
      for (let at = 0; at < body.length;) {
        const space = body.indexOf(0x20, at), length = parseInt(body.subarray(at, space).toString('latin1'), 10)
        assert.ok(length > 0, `PAX record at ${offset}: bad length`)
        const record = body.subarray(space + 1, at + length - 1).toString('utf8'), eq = record.indexOf('=')
        if (record.slice(0, eq) === 'path') paxPath = record.slice(eq + 1)
        at += length
      }
      continue
    }
    if (type === 'g') continue
    assert.ok('0257'.includes(type), `tar entry at ${offset}: unexpected entry type ${JSON.stringify(type)}`)
    let path = field(header, 0, 100).toString('utf8')
    if (field(header, 257, 6).toString('latin1') === 'ustar') { const prefix = field(header, 345, 155).toString('utf8'); if (prefix) path = `${prefix}/${path}` }
    path = paxPath ?? longName ?? path
    longName = paxPath = null
    path = path.replace(/^(\.\/)+/, '').replace(/\/$/, '')
    if (path === '.' || path === '') continue
    entries.push({ path, type: type === '7' ? '0' : type, content: body })
  }
  assert.ok(ended, 'tar archive: no end-of-archive block')
  return entries
}

// The archive must be an uncompressed tar of the source: every file once,
// as a regular file with its bytes, the empty directory as a directory, any
// other entry a directory of the source, and nothing else.
function checkArchive(i, archive) {
  const { files: wanted, directories } = expectedTrees[i]
  assert.equal(archive.length % 512, 0, `fixture ${i}: an archive of ${archive.length} bytes is not whole 512-byte blocks`)
  let entries
  try { entries = readTar(archive) } catch (error) { assert.fail(`fixture ${i}: the archive is not a tar file: ${error.message}`) }
  const byPath = new Map()
  for (const entry of entries) {
    assert.ok(!byPath.has(entry.path), `fixture ${i}: ${entry.path} is in the archive twice`)
    byPath.set(entry.path, entry)
  }
  for (const file of wanted) {
    const entry = byPath.get(file.path)
    assert.ok(entry, `fixture ${i}: ${file.path} is not in the archive`)
    assert.equal(entry.type, '0', `fixture ${i}: ${file.path} must be a regular file in the archive`)
    assert.ok(Buffer.from(file.content).equals(entry.content), `fixture ${i}: ${file.path} has other bytes in the archive`)
    byPath.delete(file.path)
  }
  for (const empty of expectedTrees[i].empty) assert.equal(byPath.get(empty.replace(/\/$/, ''))?.type, '5', `fixture ${i}: the empty directory ${empty} is not in the archive`)
  for (const [path, entry] of byPath) assert.ok(entry.type === '5' && directories.has(path + '/'), `fixture ${i}: ${path} is in the archive but not in the source`)
}

// The extracted tree, read back from the disk: every directory, and every
// file with its bytes and permission bits.
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
function checkExtracted(i, found) {
  const { files: wanted, directories } = expectedTrees[i]
  assert.deepEqual([...found.keys()].sort(), [...directories, ...wanted.map((file) => file.path)].sort(), `fixture ${i}: the destination must hold exactly the files and directories of the source`)
  for (const file of wanted) {
    const copy = found.get(file.path)
    assert.ok(copy.file, `fixture ${i}: ${file.path} must be a regular file`)
    assert.ok(Buffer.from(file.content).equals(copy.content), `fixture ${i}: ${file.path} differs from its source`)
    assert.equal(copy.mode.toString(8), (file.mode ?? 0o644).toString(8), `fixture ${i}: permission bits of ${file.path}`)
  }
}

function check({ input }, i) {
  let archive, found
  try { archive = readFileSync(input.archive) } catch (error) { assert.fail(`fixture ${i}: the archive file cannot be read: ${error.message}`) }
  checkArchive(i, archive)
  try { found = listing(input.target) } catch (error) { assert.fail(`fixture ${i}: the destination cannot be read: ${error.message}`) }
  checkExtracted(i, found)
}

// At load: the checks accept a correct archive and tree, and refuse wrong ones.
{
  const block = (size) => Buffer.alloc(Math.ceil(size / 512) * 512)
  const header = (path, type, size) => {
    const h = Buffer.alloc(512)
    h.write(path, 0, 100, 'utf8'); h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116)
    h.write(size.toString(8).padStart(11, '0') + '\0', 124); h.write('00000000000\0', 136); h.write(type, 156); h.write('ustar\u000000', 257, 'latin1')
    let sum = 0; for (let k = 0; k < 512; k++) sum += k >= 148 && k < 156 ? 32 : h[k]
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 'latin1')
    return h
  }
  const longEntry = (path) => { const name = Buffer.from(path + '\0'); const b = block(name.length); name.copy(b); return [header('././@LongLink', 'L', name.length), b] }
  const tarOf = (i, { drop, change, extra, skipEmpty } = {}) => {
    const parts = []
    for (const dir of expectedTrees[i].directories) if (!(skipEmpty && expectedTrees[i].empty.includes(dir))) parts.push(...longEntry('./' + dir), header('dir', '5', 0))
    for (const file of expectedTrees[i].files) {
      if (file.path === drop) continue
      const content = Buffer.from(file.content), b = block(content.length)
      content.copy(b); if (file.path === change) b[0] ^= 1
      parts.push(...longEntry('./' + file.path), header('file', '0', content.length), b)
    }
    if (extra) parts.push(header(extra, '0', 0))
    return Buffer.concat([...parts, Buffer.alloc(1024)])
  }
  const model = (i) => new Map([...[...expectedTrees[i].directories].map((dir) => [dir, null]), ...expectedTrees[i].files.map((file) => [file.path, { file: true, mode: file.mode ?? 0o644, content: Buffer.from(file.content) }])])
  for (let i = 0; i < cases.length; i++) {
    checkArchive(i, tarOf(i))
    checkExtracted(i, model(i))
  }
  const victim = 'empty.txt', bits = 'secrets/key-0.pem', unicode = 'docs/日本語/はじめに.md'
  for (const [what, archive] of [
    ['a dropped empty file', tarOf(0, { drop: victim })],
    ['changed bytes', tarOf(0, { change: unicode })],
    ['an extra file', tarOf(0, { extra: 'stray.tmp' })],
    ['no empty directory', tarOf(0, { skipEmpty: true })],
    ['no end-of-archive block', tarOf(0).subarray(0, tarOf(0).length - 1024)],
  ]) assert.throws(() => checkArchive(0, archive), undefined, `the archive check must refuse ${what}`)
  const without = (path) => { const m = model(0); m.delete(path); return m }
  const withMode = (path, mode) => { const m = model(0); m.set(path, { ...m.get(path), mode }); return m }
  for (const [what, found] of [
    ['a dropped empty file', without(victim)],
    ['a dropped empty directory', without('dist/')],
    ['a lost private mode', withMode(bits, 0o644)],
    ['a lost executable bit', withMode('bin/tool-0.sh', 0o644)],
  ]) assert.throws(() => checkExtracted(0, found), undefined, `the tree check must refuse ${what}`)
}

// An operation returns nothing that counts: its result is on the disk. The
// runners of the other languages report here while their process waits, with
// every case's archive and destination still in place.
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, i))
}
export const verify = (operation) => cases.forEach((c, i) => { operation(c.input); check(c, i) })
export const consume = () => 1
