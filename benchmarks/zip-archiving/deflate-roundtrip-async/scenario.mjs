import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
import { deflateRawSync, gzipSync, inflateRawSync } from 'node:zlib'

// The fixtures of deflate-roundtrip, written out again because a scenario is loaded alone beside each
// adapter; the two generators must be kept the same.
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => words[Math.floor(r() * words.length)]).join(' ')
const b64 = (r, n) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; return Array.from({ length: n }, () => a[Math.floor(r() * 64)]).join('') }
const code = (r, n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) return res.status(400).send('missing');\n  return res.json({ id: value, ok: ${r() < 0.5} });\n}\n`).join('\n')
const json = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, active: r() < 0.5, score: Math.round(r() * 10000) / 100, tags: ['a', 'b', 'c'].slice(0, 1 + Math.floor(r() * 3)) })), null, 2)
const log = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO path=/api/v1/items/${Math.floor(r() * 500)} status=${[200, 200, 404, 500][Math.floor(r() * 4)]} ms=${Math.floor(r() * 300)}`).join('\n')
const csv = (r, n) => ['id,city,temp'].concat(Array.from({ length: n }, (_, i) => `${i},${['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'][Math.floor(r() * 4)]},${(r() * 40 - 5).toFixed(1)}`)).join('\n')
const unicode = (r, n) => Array.from({ length: n }, () => ['café', '日本語のテキスト', 'Привет мир', 'naïve résumé', '😀 emoji'][Math.floor(r() * 5)]).join(' ')
const kinds = [
  ['src/handlers.js', code, 4], ['data/users.json', json, 5], ['logs/app.log', log, 8], ['data/cities.csv', csv, 14],
  ['README.md', (r, n) => `# Project\n\n${prose(r, n)}\n`, 40], ['docs/guide/日本語.txt', unicode, 20], ['docs/café.md', unicode, 12],
  ['blob/payload.b64', b64, 300], ['empty.txt', () => '', 0], ['notes/a b/c.txt', prose, 25], ['LICENSE', prose, 90], ['bin/pad.txt', () => 'abcd'.repeat(120), 0],
]
export const cases = []
for (let i = 0; i < 40; i++) {
  const r = rng(5000 + i)
  const count = 1 + (i * 5) % 9
  const input = []
  for (let j = 0; j < count; j++) {
    const [name, make, size] = kinds[(i * 3 + j * 5) % kinds.length]
    input.push({ name: `${name.replace(/(\.[^./]+)?$/, (e) => `-${j}${e}`)}`, text: make(r, size + ((i + j) % 7)) })
  }
  cases.push({ input, expected: input })
}
cases.push({ input: [{ name: 'only.txt', text: '' }], expected: [{ name: 'only.txt', text: '' }] })
// Large archives: one to three entries of 100 KB to about 300 KB of compressible text each. Every entry
// of these must be deflated, and the archive must be smaller than its input.
const large = [
  [['logs/big-app.log', log, 1600]],
  [['data/big-users.json', json, 1100]],
  [['src/big-handlers.js', code, 700], ['docs/big-notes.txt', prose, 30000]],
  [['data/big-cities.csv', csv, 9000], ['logs/big-access.log', log, 2800]],
  [['docs/big-日本語.txt', unicode, 9000], ['data/big-export.json', json, 2400], ['LICENSE-big', prose, 70000]],
  [['book/big-chapter.txt', prose, 60000]],
]
for (const [i, entries] of large.entries()) {
  const r = rng(9000 + i)
  const input = entries.map(([name, make, size]) => ({ name, text: make(r, size) }))
  cases.push({ input, expected: input, compressible: true })
}
assert.equal(cases.length, 47)
const utf8Bytes = (entries) => entries.reduce((sum, { text }) => sum + Buffer.byteLength(text), 0)

// The scenario's own strict ZIP reader (APPNOTE 6.3), which uses none of the packages. It accepts entries
// stored (method 0) or deflated (method 8); data descriptors, with or without their signature; ZIP64
// extra fields and end records; extra fields of any other kind; an archive comment; names in UTF-8 with
// the language-encoding flag (bit 11), in CP437 without it, or with an Info-ZIP Unicode Path extra field
// whose CRC matches. It refuses anything else: a bad signature, encryption, another method, a CRC or size
// that does not match the data, a local header that disagrees with the central directory, entries out
// of order or with unreferenced bytes between them, a central directory that is not where the end record
// says or that holds another number of entries, and data after the end record.
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (bytes) => { let c = 0xffffffff; for (let k = 0; k < bytes.length; k++) c = crcTable[(c ^ bytes[k]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
assert.equal(crc32(Buffer.from('123456789')), 0xcbf43926)
const CP437_HIGH = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ '
assert.equal([...CP437_HIGH].length, 128)
const cp437 = (bytes) => Array.from(bytes, (b) => (b < 0x80 ? String.fromCharCode(b) : CP437_HIGH[b - 0x80])).join('')
const utf8 = new TextDecoder('utf-8', { fatal: true })
const SIG_LOCAL = 0x04034b50, SIG_CENTRAL = 0x02014b50, SIG_END = 0x06054b50, SIG_DESCRIPTOR = 0x08074b50
const SIG_ZIP64_END = 0x06064b50, SIG_ZIP64_LOCATOR = 0x07064b50
const FLAG_ENCRYPTED = 0x0001, FLAG_DESCRIPTOR = 0x0008, FLAG_STRONG = 0x0040, FLAG_UTF8 = 0x0800, FLAG_MASKED = 0x2000
const extraFields = (bytes, what) => {
  const out = new Map()
  let pos = 0
  while (pos < bytes.length) {
    if (pos + 4 > bytes.length) throw new Error(`${what}: truncated extra field`)
    const id = bytes.readUInt16LE(pos), size = bytes.readUInt16LE(pos + 2)
    if (pos + 4 + size > bytes.length) throw new Error(`${what}: extra field 0x${id.toString(16)} runs past its block`)
    if (out.has(id)) throw new Error(`${what}: extra field 0x${id.toString(16)} given twice`)
    out.set(id, bytes.subarray(pos + 4, pos + 4 + size))
    pos += 4 + size
  }
  return out
}
// Replaces each 32-bit field that is 0xFFFFFFFF with the next 64-bit value of the ZIP64 extra field.
const zip64Values = (extra, fields, what) => {
  const wanted = fields.filter(([, value]) => value === 0xffffffff)
  if (!wanted.length) return Object.fromEntries(fields)
  const block = extra.get(0x0001)
  if (!block || block.length < 8 * wanted.length) throw new Error(`${what}: a size or offset is 0xFFFFFFFF without a ZIP64 extra field for it`)
  let pos = 0
  return Object.fromEntries(fields.map(([key, value]) => {
    if (value !== 0xffffffff) return [key, value]
    const big = block.readBigUInt64LE(pos)
    pos += 8
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${what}: ZIP64 value too large`)
    return [key, Number(big)]
  }))
}
const decodeName = (raw, flags, extra, what) => {
  if (flags & FLAG_UTF8) {
    try { return utf8.decode(raw) } catch { throw new Error(`${what}: name marked UTF-8 is not UTF-8`) }
  }
  const unicodePath = extra.get(0x7075)
  if (unicodePath) {
    if (unicodePath.length < 5 || unicodePath[0] !== 1) throw new Error(`${what}: malformed Unicode Path extra field`)
    if (unicodePath.readUInt32LE(1) === crc32(raw)) {
      try { return utf8.decode(unicodePath.subarray(5)) } catch { throw new Error(`${what}: Unicode Path extra field is not UTF-8`) }
    }
  }
  return cp437(raw)
}
// Returns [{ name, method, data }] in central-directory order, or throws.
export const readZip = (bytes) => {
  if (bytes.length < 22) throw new Error(`${bytes.length} bytes is too short for a ZIP archive`)
  let end = -1
  for (let pos = bytes.length - 22; pos >= Math.max(0, bytes.length - 22 - 0xffff); pos--) {
    if (bytes.readUInt32LE(pos) === SIG_END && pos + 22 + bytes.readUInt16LE(pos + 20) === bytes.length) { end = pos; break }
  }
  if (end < 0) throw new Error('no end of central directory record that ends the archive')
  let disk = bytes.readUInt16LE(end + 4), cdDisk = bytes.readUInt16LE(end + 6)
  let diskCount = bytes.readUInt16LE(end + 8), count = bytes.readUInt16LE(end + 10)
  let cdSize = bytes.readUInt32LE(end + 12), cdOffset = bytes.readUInt32LE(end + 16)
  let cdEnd = end
  if (count === 0xffff || diskCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    const locator = end - 20
    if (locator < 0 || bytes.readUInt32LE(locator) !== SIG_ZIP64_LOCATOR) throw new Error('ZIP64 values without a ZIP64 end locator')
    const record = Number(bytes.readBigUInt64LE(locator + 8))
    if (bytes.readUInt32LE(locator + 4) !== 0 || bytes.readUInt32LE(locator + 16) !== 1) throw new Error('ZIP64 end locator names another disk')
    if (record + 56 > locator || bytes.readUInt32LE(record) !== SIG_ZIP64_END) throw new Error('no ZIP64 end record where the locator says')
    if (record + 12 + Number(bytes.readBigUInt64LE(record + 4)) !== locator) throw new Error('ZIP64 end record size does not reach the locator')
    disk = bytes.readUInt32LE(record + 16); cdDisk = bytes.readUInt32LE(record + 20)
    diskCount = Number(bytes.readBigUInt64LE(record + 24)); count = Number(bytes.readBigUInt64LE(record + 32))
    cdSize = Number(bytes.readBigUInt64LE(record + 40)); cdOffset = Number(bytes.readBigUInt64LE(record + 48))
    cdEnd = record
  }
  if (disk !== 0 || cdDisk !== 0 || diskCount !== count) throw new Error('a multi-disk archive')
  if (cdOffset + cdSize !== cdEnd) throw new Error(`central directory of ${cdSize} bytes at ${cdOffset} does not end where the end record starts (${cdEnd})`)
  const entries = []
  let pos = cdOffset, next = 0
  for (let k = 0; k < count; k++) {
    const what = `central entry ${k}`
    if (pos + 46 > cdEnd || bytes.readUInt32LE(pos) !== SIG_CENTRAL) throw new Error(`${what}: no central directory header at ${pos}`)
    const flags = bytes.readUInt16LE(pos + 8), method = bytes.readUInt16LE(pos + 10)
    const nameLength = bytes.readUInt16LE(pos + 28), extraLength = bytes.readUInt16LE(pos + 30), commentLength = bytes.readUInt16LE(pos + 32)
    if (bytes.readUInt16LE(pos + 34) !== 0) throw new Error(`${what}: on another disk`)
    const raw = bytes.subarray(pos + 46, pos + 46 + nameLength)
    const extra = extraFields(bytes.subarray(pos + 46 + nameLength, pos + 46 + nameLength + extraLength), what)
    const { csize, usize, offset } = zip64Values(extra, [['usize', bytes.readUInt32LE(pos + 24)], ['csize', bytes.readUInt32LE(pos + 20)], ['offset', bytes.readUInt32LE(pos + 42)]], what)
    const realCrc = bytes.readUInt32LE(pos + 16)
    pos += 46 + nameLength + extraLength + commentLength
    if (pos > cdEnd) throw new Error(`${what}: runs past the central directory`)
    if (flags & (FLAG_ENCRYPTED | FLAG_STRONG | FLAG_MASKED)) throw new Error(`${what}: encrypted`)
    if (method !== 0 && method !== 8) throw new Error(`${what}: compression method ${method} is neither stored nor deflate`)
    const name = decodeName(raw, flags, extra, what)
    // The local header, which must come right after the previous entry.
    if (offset !== next) throw new Error(`${what}: local header at ${offset}, expected at ${next} (entries out of order or bytes between them)`)
    if (offset + 30 > cdOffset || bytes.readUInt32LE(offset) !== SIG_LOCAL) throw new Error(`${what}: no local header at ${offset}`)
    if (bytes.readUInt16LE(offset + 6) !== flags) throw new Error(`${what}: local flags differ from the central directory`)
    if (bytes.readUInt16LE(offset + 8) !== method) throw new Error(`${what}: local method differs from the central directory`)
    const localNameLength = bytes.readUInt16LE(offset + 26), localExtraLength = bytes.readUInt16LE(offset + 28)
    if (!Buffer.from(bytes.subarray(offset + 30, offset + 30 + localNameLength)).equals(Buffer.from(raw))) throw new Error(`${what}: local name differs from the central directory`)
    const localExtra = extraFields(bytes.subarray(offset + 30 + localNameLength, offset + 30 + localNameLength + localExtraLength), `${what} (local)`)
    const localCrc = bytes.readUInt32LE(offset + 14), localCsize = bytes.readUInt32LE(offset + 18), localUsize = bytes.readUInt32LE(offset + 22)
    const local64 = localCsize === 0xffffffff || localUsize === 0xffffffff
    let localSizes = { csize: localCsize, usize: localUsize }
    if (local64) {
      const block = localExtra.get(0x0001)
      if (!block || block.length < 16) throw new Error(`${what}: local ZIP64 sizes without a ZIP64 extra field`)
      localSizes = { usize: Number(block.readBigUInt64LE(0)), csize: Number(block.readBigUInt64LE(8)) }
    }
    const zero = localCrc === 0 && localSizes.csize === 0 && localSizes.usize === 0
    if (!(flags & FLAG_DESCRIPTOR) || !zero) {
      if (localCrc !== realCrc || localSizes.csize !== csize || localSizes.usize !== usize) throw new Error(`${what}: local CRC or sizes differ from the central directory`)
    }
    const dataStart = offset + 30 + localNameLength + localExtraLength
    let dataEnd = dataStart + csize
    if (dataEnd > cdOffset) throw new Error(`${what}: data runs into the central directory`)
    const stored = bytes.subarray(dataStart, dataEnd)
    if (flags & FLAG_DESCRIPTOR) {
      let at = dataEnd
      if (at + 4 <= cdOffset && bytes.readUInt32LE(at) === SIG_DESCRIPTOR) at += 4
      const wide = local64 || extra.has(0x0001)
      const width = wide ? 8 : 4
      if (at + 4 + 2 * width > cdOffset) throw new Error(`${what}: data descriptor runs into the central directory`)
      const dCrc = bytes.readUInt32LE(at)
      const dCsize = wide ? Number(bytes.readBigUInt64LE(at + 4)) : bytes.readUInt32LE(at + 4)
      const dUsize = wide ? Number(bytes.readBigUInt64LE(at + 12)) : bytes.readUInt32LE(at + 8)
      if (dCrc !== realCrc || dCsize !== csize || dUsize !== usize) throw new Error(`${what}: data descriptor differs from the central directory`)
      dataEnd = at + 4 + 2 * width
    }
    next = dataEnd
    let data
    if (method === 0) {
      if (csize !== usize) throw new Error(`${what}: stored entry with compressed size ${csize} and size ${usize}`)
      data = stored
    } else {
      try { data = inflateRawSync(stored) } catch (error) { throw new Error(`${what}: deflate data does not inflate (${error.message})`) }
    }
    if (data.length !== usize) throw new Error(`${what}: ${data.length} bytes of data, header says ${usize}`)
    if (crc32(data) !== realCrc) throw new Error(`${what}: CRC-32 does not match the data`)
    entries.push({ name, method, data })
  }
  if (pos !== cdEnd) throw new Error(`the central directory holds bytes after its ${count} entries`)
  if (next !== cdOffset) throw new Error(`bytes between the last entry (ends at ${next}) and the central directory (at ${cdOffset})`)
  return entries
}

const bytesOf = (view) => Buffer.from(view.buffer, view.byteOffset, view.byteLength)
// Each output is { entries, archive }: the entries read back as [{ name, text }] in archive order, and
// the archive bytes the package wrote (a Uint8Array or a Buffer) that they were read from.
export const verifyOne = (i, output) => {
  const { expected, compressible } = cases[i]
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
  try { read = readZip(bytesOf(archive)) } catch (error) { assert.fail(`fixture ${i}: the archive does not read as ZIP: ${error.message}`) }
  assert.equal(read.length, expected.length, `fixture ${i}: entries in the archive`)
  for (const [j, entry] of expected.entries()) {
    const got = read[j]
    assert.equal(got.name, entry.name, `fixture ${i} archive entry ${j}: name`)
    assert.ok(Buffer.from(got.data).equals(Buffer.from(entry.text)), `fixture ${i} archive entry ${j}: content differs`)
    if (compressible) assert.equal(got.method, 8, `fixture ${i} archive entry ${j}: stored, not deflated`)
  }
  // Storing the data, or handing the input back, cannot be smaller than the input.
  if (compressible) assert.ok(archive.byteLength < utf8Bytes(expected), `fixture ${i}: archive of ${archive.byteLength} bytes is not smaller than its ${utf8Bytes(expected)} bytes of input`)
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
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b }
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b }
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b }
const extra = (id, body) => Buffer.concat([u16(id), u16(body.length), body])
const writeZip = (files, o = {}) => {
  const parts = [], central = []
  let offset = 0
  for (const [k, { name, text }] of files.entries()) {
    const data = Buffer.from(text)
    const stored = o.store === true || (o.store === 'empty' && data.length === 0) || (o.storeSmall && data.length < 64)
    const method = o.method ?? (stored ? 0 : 8)
    const body = method === 8 ? deflateRawSync(data) : data
    const crc = o.badCrc && k === 0 ? crc32(data) ^ 1 : crc32(data)
    const ascii = /^[\x20-\x7e]*$/.test(name)
    let flags = (o.descriptor ? FLAG_DESCRIPTOR : 0) | (o.encrypted ? FLAG_ENCRYPTED : 0)
    let raw = Buffer.from(name)
    let nameExtra = Buffer.alloc(0)
    if (!ascii) {
      if (o.names === 'cp437') raw = Buffer.from(Array.from(name, (c) => { const at = CP437_HIGH.indexOf(c); return at < 0 ? c.charCodeAt(0) : 0x80 + at }))
      else if (o.names === 'unicode-path') { raw = Buffer.from(name.replace(/[^\x20-\x7e]/g, '_')); nameExtra = extra(0x7075, Buffer.concat([Buffer.from([1]), u32(crc32(raw)), Buffer.from(name)])) }
      else if (o.names !== 'unflagged') flags |= FLAG_UTF8
    }
    const zip64 = o.zip64 === true
    const time = extra(0x5455, Buffer.concat([Buffer.from([1]), u32(1791000000)]))
    const localExtra = Buffer.concat([zip64 ? extra(0x0001, Buffer.concat([u64(data.length), u64(body.length)])) : Buffer.alloc(0), time, nameExtra])
    const centralExtra = Buffer.concat([zip64 ? extra(0x0001, Buffer.concat([u64(data.length), u64(body.length), u64(offset)])) : Buffer.alloc(0), nameExtra])
    const zeroLocal = o.descriptor && !o.descriptorKeepsSizes
    const local = Buffer.concat([
      u32(SIG_LOCAL), u16(zip64 ? 45 : 20), u16(flags), u16(method), u16(0), u16(0x5b41),
      u32(zeroLocal ? 0 : crc), u32(zeroLocal ? 0 : zip64 ? 0xffffffff : body.length), u32(zeroLocal ? 0 : zip64 ? 0xffffffff : data.length),
      u16(raw.length), u16(localExtra.length), raw, localExtra,
    ])
    const descriptor = o.descriptor
      ? Buffer.concat([o.descriptorSignature === false ? Buffer.alloc(0) : u32(SIG_DESCRIPTOR), u32(crc), zip64 ? u64(body.length) : u32(body.length), zip64 ? u64(data.length) : u32(data.length)])
      : Buffer.alloc(0)
    const gap = o.gap && k === 0 ? Buffer.alloc(3) : Buffer.alloc(0)
    central.push(Buffer.concat([
      u32(SIG_CENTRAL), u16(0x031e), u16(zip64 ? 45 : 20), u16(flags), u16(method), u16(0), u16(0x5b41),
      u32(crc), u32(zip64 ? 0xffffffff : body.length), u32(zip64 ? 0xffffffff : data.length),
      u16(raw.length), u16(centralExtra.length), u16(0), u16(0), u16(0), u32(0o100644 << 16), u32(zip64 ? 0xffffffff : offset),
      raw, centralExtra,
    ]))
    parts.push(local, body, descriptor, gap)
    offset += local.length + body.length + descriptor.length + gap.length
  }
  const cd = Buffer.concat(central)
  const count = o.wrongCount ? files.length + 1 : files.length
  const comment = Buffer.from(o.comment ?? '')
  const tail = []
  if (o.zip64 === true) {
    const record = Buffer.concat([u32(SIG_ZIP64_END), u64(44), u16(45), u16(45), u32(0), u32(0), u64(count), u64(count), u64(cd.length), u64(offset)])
    tail.push(record, u32(SIG_ZIP64_LOCATOR), u32(0), u64(offset + cd.length), u32(1))
    tail.push(u32(SIG_END), u16(0), u16(0), u16(0xffff), u16(0xffff), u32(0xffffffff), u32(0xffffffff), u16(comment.length), comment)
  } else tail.push(u32(SIG_END), u16(0), u16(0), u16(count), u16(count), u32(cd.length), u32(offset), u16(comment.length), comment)
  return Buffer.concat([...parts, cd, ...tail, Buffer.from(o.trailing ?? '')])
}
const read = (entries) => entries.map(({ name, text }) => ({ name, text }))
const good = (i, archive) => ({ entries: read(cases[i].input), archive })
const nonAscii = (input) => input.some(({ name }) => !/^[\x20-\x7e]*$/.test(name))
// Fixture 1 has an empty file and a CP437-encodable non-ASCII name (café); fixture 8 an empty file and a
// name in Japanese; 0 one file; 40 one empty file; 41 and 45 are large ones.
for (const i of [0, 1, 8, 40, 41, 45]) {
  const { input, compressible } = cases[i]
  const plain = writeZip(input)
  // Every correct spelling passes.
  verifyOne(i, good(i, plain))
  verifyOne(i, good(i, new Uint8Array(plain)))
  for (const o of [{ descriptor: true }, { descriptor: true, descriptorSignature: false }, { descriptor: true, descriptorKeepsSizes: true }, { zip64: true }, { zip64: true, descriptor: true }, { comment: 'made by a test' }, { names: 'unicode-path' }, { store: 'empty' }]) {
    verifyOne(i, good(i, writeZip(input, o)))
  }
  if (!compressible) verifyOne(i, good(i, writeZip(input, { storeSmall: true })))
  if (input.every(({ name }) => [...name].every((c) => c.charCodeAt(0) < 0x80 || CP437_HIGH.includes(c)))) verifyOne(i, good(i, writeZip(input, { names: 'cp437' })))
  const swapped = input.length > 1 ? [input[1], input[0], ...input.slice(2)] : null
  const changed = input.map((e, j) => (j === 0 ? { ...e, text: e.text + 'x' } : e))
  const wrong = {
    'the input echoed as JSON': good(i, Buffer.from(JSON.stringify(input))),
    'a gzip stream': good(i, gzipSync(Buffer.from(input.map(({ text }) => text).join('')))),
    'no archive': { entries: read(input) },
    'a bad CRC-32': good(i, writeZip(input, { badCrc: true })),
    'a changed file in the archive': good(i, writeZip(changed)),
    'an encrypted entry': good(i, writeZip(input, { encrypted: true })),
    'compression method 9': good(i, writeZip(input, { method: 9 })),
    'a wrong entry count in the end record': good(i, writeZip(input, { wrongCount: true })),
    'data after the end record': good(i, writeZip(input, { trailing: 'junk' })),
    'bytes between entries': good(i, writeZip(input, { gap: true })),
    'an extra entry in the archive': good(i, writeZip([...input, { name: 'extra.txt', text: 'x' }])),
    'a directory entry added': good(i, writeZip([{ name: 'src/', text: '' }, ...input])),
    'a changed file read back': { entries: read(changed), archive: plain },
    'entries read back with extra fields': { entries: input.map(({ name, text }) => ({ name, text, size: text.length })), archive: plain },
    "another fixture's output": good((i + 1) % cases.length, writeZip(cases[(i + 1) % cases.length].input)),
  }
  if (swapped) {
    wrong['entries reordered in the archive'] = good(i, writeZip(swapped))
    wrong['entries read back reordered'] = { entries: read(swapped), archive: plain }
  }
  if (nonAscii(input)) wrong['UTF-8 names without the language-encoding flag'] = good(i, writeZip(input, { names: 'unflagged' }))
  if (compressible) wrong['the entries stored, not deflated'] = good(i, writeZip(input, { store: true }))
  if (input.some(({ text }) => text === '')) {
    const dropped = input.filter(({ text }) => text !== '')
    wrong['the empty file dropped'] = { entries: read(dropped), archive: writeZip(dropped) }
  }
  for (const [what, output] of Object.entries(wrong)) {
    assert.throws(() => verifyOne(i, output), undefined, `the check must refuse ${what} (fixture ${i})`)
  }
}
assert.ok(cases[1].input.some(({ text }) => text === '') && cases[1].input.some(({ name }) => name.includes('café')), 'fixture 1 must hold an empty file and café')
assert.ok(cases[8].input.some(({ name }) => name.includes('日本語')), 'fixture 8 must hold a Japanese name')
