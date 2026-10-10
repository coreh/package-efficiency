import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { gzipSync } from 'node:zlib'

// The fixtures of in-memory-roundtrip, written out again because a scenario is loaded alone beside each
// adapter; the two generators must be kept the same.
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const pick = (r, a) => a[Math.floor(r() * a.length)]
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => pick(r, words)).join(' ')
const code = (r, n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) return res.status(${pick(r, [400, 404, 422])}).send('missing');\n  return res.json({ id: value, ok: ${r() < 0.5} });\n}\n`).join('\n')
const json = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, active: r() < 0.5, score: Math.round(r() * 10000) / 100 })), null, 2)
const locale = (r, n) => JSON.stringify(Object.fromEntries(Array.from({ length: n }, (_, i) => [`key.${i}`, pick(r, ['Olá, mundo', 'Configurações', '日本語のテキスト', 'Привет мир', 'Save changes', 'café au lait', 'Ça marche'])])), null, 2)
const log = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO path=/api/v1/items/${Math.floor(r() * 500)} status=${pick(r, [200, 200, 404, 500])}`).join('\n')
const csv = (r, n) => ['id,city,temp'].concat(Array.from({ length: n }, (_, i) => `${i},${pick(r, ['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'])},${(r() * 40 - 5).toFixed(1)}`)).join('\n')
const md = (r, n) => `# Notes ${Math.floor(r() * 100)}\n\n${prose(r, n)}\n`
// [directory, extension, generator, size range start, size span]
const kinds = [
  ['src/components', 'js', code, 2, 10], ['src/util', 'ts', code, 1, 8], ['config', 'json', json, 1, 12], ['locales', 'json', locale, 4, 30],
  ['docs/guide', 'md', md, 30, 300], ['data', 'csv', csv, 8, 60], ['logs', 'log', log, 3, 25], ['assets/texts/日本語', 'txt', prose, 20, 200],
  ['docs/café', 'md', md, 20, 150],
]
export const cases = []
for (let i = 0; i < 24; i++) {
  const r = rng(9100 + i)
  const count = 20 + i * 8 // 20 to 204 entries
  const input = []
  for (let j = 0; j < count; j++) {
    const [dir, ext, make, lo, span] = kinds[(i + j * 7 + Math.floor(r() * 3)) % kinds.length]
    input.push({ name: `${dir}/part${Math.floor(j / 9)}/file-${j}.${ext}`, text: make(r, lo + Math.floor(r() * span)) })
  }
  if (i % 6 === 0) input[Math.floor(count / 2)].text = '' // an empty file
  cases.push({ input, expected: input })
}
// Every name fits the 100-byte name field of a plain ustar header, so no writer needs a prefix or an
// extended header for these fixtures (the reader below still accepts both).
for (const { input } of cases) for (const { name } of input) assert.ok(Buffer.byteLength(name) <= 100, `name over 100 bytes: ${name}`)

// The scenario's own strict tar reader. It accepts POSIX ustar ('ustar\0' '00') and GNU ('ustar  \0')
// headers, regular-file entries ('0' or NUL), and before an entry a PAX extended header ('x': path,
// size, mtime) or a GNU long name ('L'). It refuses anything else: a bad checksum, a malformed number,
// another entry type (directories included), a global PAX header, non-zero padding, data after the
// end-of-archive blocks, a missing or short end of archive, and names that are not UTF-8.
const BLOCK = 512
const utf8 = new TextDecoder('utf-8', { fatal: true })
const cstring = (bytes, offset, length) => {
  const field = bytes.subarray(offset, offset + length)
  const end = field.indexOf(0)
  return utf8.decode(end === -1 ? field : field.subarray(0, end))
}
const octal = (bytes, offset, length, what) => {
  const text = Buffer.from(bytes.subarray(offset, offset + length)).toString('latin1').replace(/[\0 ]+$/, '').replace(/^ +/, '')
  if (!/^[0-7]+$/.test(text)) throw new Error(`${what}: not an octal number (${JSON.stringify(text)})`)
  return parseInt(text, 8)
}
const allZero = (bytes) => bytes.every((b) => b === 0)
const parsePax = (data) => {
  const out = {}
  let pos = 0
  while (pos < data.length) {
    const space = data.indexOf(0x20, pos)
    const digits = space === -1 ? '' : Buffer.from(data.subarray(pos, space)).toString('latin1')
    const end = pos + Number(digits)
    if (!/^[1-9][0-9]*$/.test(digits) || end > data.length || data[end - 1] !== 0x0a) throw new Error(`malformed PAX record at ${pos}`)
    const record = utf8.decode(data.subarray(space + 1, end - 1))
    const eq = record.indexOf('=')
    if (eq < 1) throw new Error(`malformed PAX record at ${pos}`)
    out[record.slice(0, eq)] = record.slice(eq + 1)
    pos = end
  }
  return out
}
// Returns [{ name, mode, mtime, data }] for an uncompressed archive, or throws.
export const readTar = (bytes) => {
  if (bytes.length % BLOCK !== 0) throw new Error(`archive of ${bytes.length} bytes is not whole 512-byte blocks`)
  const entries = []
  let pos = 0, pax = null, longName = null
  while (true) {
    if (pos + BLOCK > bytes.length) throw new Error('archive ends without its two zero blocks')
    const header = bytes.subarray(pos, pos + BLOCK)
    if (allZero(header)) {
      if (pax || longName !== null) throw new Error('an extended header with no entry after it')
      if (bytes.length - pos < 2 * BLOCK) throw new Error('archive ends with one zero block, not two')
      if (!allZero(bytes.subarray(pos))) throw new Error('data after the end-of-archive blocks')
      return entries
    }
    let sum = 0
    for (let k = 0; k < BLOCK; k++) sum += k >= 148 && k < 156 ? 32 : header[k]
    if (octal(header, 148, 8, 'checksum') !== sum) throw new Error(`header at ${pos}: bad checksum`)
    const magic = Buffer.from(header.subarray(257, 265)).toString('latin1')
    const posix = magic === 'ustar\x0000'
    if (!posix && magic !== 'ustar  \0') throw new Error(`header at ${pos}: not a ustar or GNU header (${JSON.stringify(magic)})`)
    const flag = String.fromCharCode(header[156])
    let size = octal(header, 124, 12, 'size')
    const dataStart = pos + BLOCK
    const take = (n) => {
      const end = dataStart + n, padded = dataStart + Math.ceil(n / BLOCK) * BLOCK
      if (padded > bytes.length) throw new Error(`header at ${pos}: data runs past the end of the archive`)
      if (!allZero(bytes.subarray(end, padded))) throw new Error(`header at ${pos}: padding is not zero`)
      pos = padded
      return bytes.subarray(dataStart, end)
    }
    if (flag === 'x') {
      if (pax) throw new Error(`header at ${pos}: two PAX headers in a row`)
      pax = parsePax(take(size))
      continue
    }
    if (flag === 'L') {
      if (longName !== null) throw new Error(`header at ${pos}: two long names in a row`)
      longName = cstring(take(size), 0, size)
      continue
    }
    if (flag !== '0' && flag !== '\0') throw new Error(`header at ${pos}: entry type ${JSON.stringify(flag)} is not a regular file`)
    let name = cstring(header, 0, 100)
    const prefix = posix ? cstring(header, 345, 155) : ''
    if (prefix) name = `${prefix}/${name}`
    if (longName !== null) name = longName
    let mtime = octal(header, 136, 12, 'mtime')
    if (pax) {
      if ('path' in pax) name = pax.path
      if ('size' in pax) { if (!/^[0-9]+$/.test(pax.size)) throw new Error('bad PAX size'); size = Number(pax.size) }
      if ('mtime' in pax) { if (!/^-?[0-9]+(\.[0-9]+)?$/.test(pax.mtime)) throw new Error('bad PAX mtime'); mtime = Number(pax.mtime) }
    }
    const mode = octal(header, 100, 8, 'mode') & 0o7777
    entries.push({ name, mode, mtime, data: take(size) })
    pax = null
    longName = null
  }
}

const bytesOf = (view) => Buffer.from(view.buffer, view.byteOffset, view.byteLength)
// Each output is { entries, archive }: the entries read back as [{ name, text }] in archive order, and
// the archive bytes the package wrote (a Uint8Array or a Buffer) that they were read from.
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(output && typeof output === 'object', `fixture ${i}: object output required`)
  const { entries: out, archive } = output
  assert.ok(Array.isArray(out), `fixture ${i}: a list of entries is required`)
  assert.equal(out.length, expected.length, `fixture ${i}: entry count`)
  for (const [j, entry] of expected.entries()) {
    assert.deepStrictEqual(Object.keys(out[j]).sort(), ['name', 'text'], `fixture ${i} entry ${j}: fields`)
    assert.equal(out[j].name, entry.name, `fixture ${i} entry ${j}: name`)
    assert.equal(out[j].text, entry.text, `fixture ${i} entry ${j}: text`)
  }
  assert.ok(ArrayBuffer.isView(archive) && archive.BYTES_PER_ELEMENT === 1 && !(archive instanceof Uint8ClampedArray), `fixture ${i}: the archive must be a Uint8Array`)
  let read
  try { read = readTar(bytesOf(archive)) } catch (error) { assert.fail(`fixture ${i}: the archive does not read as tar: ${error.message}`) }
  assert.equal(read.length, expected.length, `fixture ${i}: entries in the archive`)
  for (const [j, entry] of expected.entries()) {
    const got = read[j]
    assert.equal(got.name, entry.name, `fixture ${i} archive entry ${j}: name`)
    assert.equal(got.mode, 0o644, `fixture ${i} archive entry ${j}: mode ${got.mode.toString(8)}, not 644`)
    assert.equal(got.mtime, 0, `fixture ${i} archive entry ${j}: modification time ${got.mtime}, not 0`)
    assert.ok(Buffer.from(got.data).equals(Buffer.from(entry.text)), `fixture ${i} archive entry ${j}: content differs`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (result) => result.entries.length

// Proof that the reader takes every correct spelling and that the check refuses outputs that did not do
// the job. A small writer of the scenario's own builds the archives (it is used for nothing else).
const putString = (h, offset, length, text) => { const b = Buffer.from(text); assert.ok(b.length <= length); b.copy(h, offset) }
const putOctal = (h, offset, length, n) => putString(h, offset, length, n.toString(8).padStart(length - 1, '0'))
const header = ({ name, size, flag = '0', mode = 0o644, mtime = 0, gnu = false, prefix = '' }) => {
  const h = Buffer.alloc(BLOCK)
  putString(h, 0, 100, name)
  putOctal(h, 100, 8, mode); putOctal(h, 108, 8, 0); putOctal(h, 116, 8, 0)
  putOctal(h, 124, 12, size); putOctal(h, 136, 12, mtime)
  h[156] = flag.charCodeAt(0)
  if (gnu) putString(h, 257, 8, 'ustar  \0')
  else { putString(h, 257, 6, 'ustar\0'); putString(h, 263, 2, '00'); putString(h, 345, 155, prefix) }
  let sum = 0
  for (let k = 0; k < BLOCK; k++) sum += k >= 148 && k < 156 ? 32 : h[k]
  putString(h, 148, 8, sum.toString(8).padStart(6, '0') + '\0 ')
  return h
}
const padded = (data) => Buffer.concat([data, Buffer.alloc((BLOCK - (data.length % BLOCK)) % BLOCK)])
const paxRecord = (key, value) => {
  const body = ` ${key}=${value}\n`
  let n = Buffer.byteLength(body) + 1
  while (String(n).length + Buffer.byteLength(body) !== n) n++
  return `${n}${body}`
}
const writeTar = (entries, { style = 'ustar', mode = 0o644, mtime = 0, trailer = 2 * BLOCK, record = 0 } = {}) => {
  const parts = []
  for (const { name, text } of entries) {
    const data = Buffer.from(text)
    if (style === 'pax') {
      const ext = Buffer.from(paxRecord('path', name) + paxRecord('mtime', String(mtime)))
      parts.push(header({ name: 'PaxHeader/x', size: ext.length, flag: 'x' }), padded(ext))
      parts.push(header({ name: 'placeholder', size: data.length, mode })) // the time is in the PAX record only
    } else if (style === 'gnu') {
      const long = Buffer.from(`${name}\0`)
      parts.push(header({ name: '././@LongLink', size: long.length, flag: 'L', gnu: true }), padded(long))
      parts.push(header({ name: name.slice(0, 20), size: data.length, mode, mtime, gnu: true }))
    } else if (style === 'prefix') {
      const cut = name.indexOf('/')
      parts.push(header({ name: name.slice(cut + 1), prefix: name.slice(0, cut), size: data.length, mode, mtime }))
    } else parts.push(header({ name, size: data.length, mode, mtime }))
    parts.push(padded(data))
  }
  parts.push(Buffer.alloc(trailer))
  const out = Buffer.concat(parts)
  return record ? Buffer.concat([out, Buffer.alloc((record - (out.length % record)) % record)]) : out
}
const good = (i, archive) => ({ entries: cases[i].input.map(({ name, text }) => ({ name, text })), archive })
for (const i of [0, 6, 13, 23]) {
  const { input } = cases[i]
  const plain = writeTar(input)
  // Every correct spelling passes: a Buffer or a plain Uint8Array, ustar names split into a prefix, PAX
  // and GNU extended headers, and padding to a 10,240-byte record.
  verifyOne(i, good(i, plain))
  verifyOne(i, good(i, new Uint8Array(plain)))
  for (const style of ['prefix', 'pax', 'gnu']) verifyOne(i, good(i, writeTar(input, { style })))
  verifyOne(i, good(i, writeTar(input, { record: 10240 })))
  const swapped = [input[1], input[0], ...input.slice(2)]
  const changed = input.map((e, j) => (j === 3 ? { ...e, text: e.text + 'x' } : e))
  const badChecksum = Buffer.from(plain); badChecksum[3] ^= 1
  const dirtyPadding = Buffer.from(plain)
  const first = Buffer.byteLength(input[0].text)
  assert.ok(first % BLOCK !== 0, `fixture ${i}: the first file must leave padding`)
  dirtyPadding[BLOCK + first] = 32
  const withDirectory = Buffer.concat([header({ name: 'src/', size: 0, flag: '5', mode: 0o755 }), plain])
  const wrong = {
    'the input echoed as JSON': good(i, Buffer.from(JSON.stringify(input))),
    'a gzipped archive': good(i, gzipSync(plain)),
    'no archive': { entries: good(i).entries },
    'a bad header checksum': good(i, badChecksum),
    'no end-of-archive blocks': good(i, writeTar(input, { trailer: 0 })),
    'one end-of-archive block': good(i, writeTar(input, { trailer: BLOCK })),
    'entries reordered in the archive': good(i, writeTar(swapped)),
    'a changed file in the archive': good(i, writeTar(changed)),
    'mode 664': good(i, writeTar(input, { mode: 0o664 })),
    'a modification time from the clock': good(i, writeTar(input, { mtime: 1791000000 })),
    'a PAX modification time from the clock': good(i, writeTar(input, { style: 'pax', mtime: 1791000000 })),
    'non-zero padding': good(i, dirtyPadding),
    'a directory entry added': good(i, withDirectory),
    'data after the end of the archive': good(i, Buffer.concat([plain, header({ name: 'late.txt', size: 0 }), Buffer.alloc(2 * BLOCK)])),
    'a changed file read back': { entries: changed.map(({ name, text }) => ({ name, text })), archive: plain },
    'entries read back reordered': { entries: swapped.map(({ name, text }) => ({ name, text })), archive: plain },
    'entries read back with extra fields': { entries: input.map(({ name, text }) => ({ name, text, mode: 0o644 })), archive: plain },
    "another fixture's output": good((i + 1) % cases.length, writeTar(cases[(i + 1) % cases.length].input)),
  }
  if (i % 6 === 0) {
    const dropped = input.filter(({ text }) => text !== '')
    wrong['the empty file dropped'] = { entries: dropped.map(({ name, text }) => ({ name, text })), archive: writeTar(dropped) }
  }
  for (const [what, output] of Object.entries(wrong)) {
    assert.throws(() => verifyOne(i, output), undefined, `the check must refuse ${what} (fixture ${i})`)
  }
}
