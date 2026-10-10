import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Deterministic pseudo-random numbers (fixed seed); no Math.random.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
// The text corpus of the category's large-buffer tasks.
const words = 'the of and to in is that for it as was with be by on not he this are or his from at which but have an had they you were their one all we can her has there been if more when will would who so no'.split(' ')
const prose = (r, n) => Array.from({ length: n }, () => words[Math.floor(r() * words.length)]).join(' ')
const hex = (r, n) => Array.from({ length: n }, () => Math.floor(r() * 256).toString(16).padStart(2, '0')).join('')
const b64 = (r, n) => { const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; return Array.from({ length: n }, () => a[Math.floor(r() * 64)]).join('') }
const jsonRecords = (r, n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i, name: `user-${Math.floor(r() * 1000)}`, email: `u${i}@example.com`, active: r() < 0.5, score: Math.round(r() * 10000) / 100, tags: ['a', 'b', 'c'].slice(0, 1 + Math.floor(r() * 3)) })))
const logLines = (r, n) => Array.from({ length: n }, (_, i) => `2026-10-06T12:${String(i % 60).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}Z INFO request id=${Math.floor(r() * 1e6)} path=/api/v1/items/${Math.floor(r() * 500)} status=${[200, 200, 200, 404, 500][Math.floor(r() * 5)]} ms=${Math.floor(r() * 300)}`).join('\n')
const csv = (r, n) => ['id,city,temp,humidity'].concat(Array.from({ length: n }, (_, i) => `${i},${['Lisbon', 'São Paulo', 'Tokyo', 'Oslo'][Math.floor(r() * 4)]},${(r() * 40 - 5).toFixed(1)},${Math.floor(r() * 100)}`)).join('\n')
const code = (n) => Array.from({ length: n }, (_, i) => `export function handler${i}(req, res) {\n  const value = req.params.id${i};\n  if (!value) { return res.status(400).send('missing'); }\n  return res.json({ id: value, ok: true });\n}\n`).join('\n')
const html = (r, n) => `<!doctype html><html><body>${Array.from({ length: n }, (_, i) => `<div class="item item-${i % 4}"><h2>Title ${i}</h2><p>${prose(r, 12)}</p><a href="/items/${i}">more</a></div>`).join('\n')}</body></html>`
const unicode = (r, n) => Array.from({ length: n }, () => ['café', '日本語のテキスト', 'Привет мир', 'naïve résumé', '😀 emoji'][Math.floor(r() * 5)]).join(' ')
const utf8 = (s) => Buffer.from(s, 'utf8')
// A binary corpus beside it: random bytes, a little-endian float64 sensor series, fixed-size records
// and runs of palette indices (an image row), so the decoder also meets data that is not text.
const randomBytes = (r, n) => Buffer.from(Array.from({ length: n }, () => Math.floor(r() * 256)))
const floats = (r, n) => { const b = Buffer.alloc(n * 8); let v = 20; for (let i = 0; i < n; i++) { v += (r() - 0.5) * 0.2; b.writeDoubleLE(Math.round((v + Math.sin(i / 50) * 3) * 1000) / 1000, i * 8) } return b }
const records = (r, n) => { const b = Buffer.alloc(n * 16); let t = 1760000000; for (let i = 0; i < n; i++) { t += Math.floor(r() * 30); b.writeUInt32LE(1000 + i, i * 16); b.writeUInt16LE(Math.floor(r() * 6), i * 16 + 4); b.writeUInt16LE(r() < 0.9 ? 0 : 1 << Math.floor(r() * 16), i * 16 + 6); b.writeFloatLE(Math.round(r() * 1e4) / 100, i * 16 + 8); b.writeUInt32LE(t, i * 16 + 12) } return b }
const runs = (r, n) => { const out = []; while (out.length < n) { const v = Math.floor(r() * 16), len = 1 + Math.floor(r() * r() * 200); for (let j = 0; j < len && out.length < n; j++) out.push(v) } return Buffer.from(out) }
// Each kind gets a size parameter n; at scale 1 a kind is roughly 30 to 90 KB.
const kinds = [
  { name: 'prose', n: 1600, make: (r, n) => utf8(prose(r, n)) },
  { name: 'json', n: 300, make: (r, n) => utf8(jsonRecords(r, n)) },
  { name: 'logs', n: 400, make: (r, n) => utf8(logLines(r, n)) },
  { name: 'csv', n: 1200, make: (r, n) => utf8(csv(r, n)) },
  { name: 'code', n: 100, make: (r, n) => utf8(code(n)) },
  { name: 'html', n: 180, make: (r, n) => utf8(html(r, n)) },
  { name: 'unicode', n: 1600, make: (r, n) => utf8(unicode(r, n)) },
  { name: 'base64', n: 8000, make: (r, n) => utf8(b64(r, n)) },
  { name: 'hex', n: 4000, make: (r, n) => utf8(hex(r, n)) },
  { name: 'repeat', n: 240, make: (r, n) => utf8('abcd'.repeat(n * 10) + prose(r, n)) },
  { name: 'mixed', n: 40, make: (r, n) => utf8([jsonRecords(r, n), b64(r, n * 60), logLines(r, n), hex(r, n * 20), prose(r, n * 8), code(n / 4)].join('\n')) },
  { name: 'random', n: 16000, make: randomBytes },
  { name: 'float64', n: 6000, make: floats },
  { name: 'records', n: 3000, make: records },
  { name: 'runs', n: 60000, make: runs },
]
// Presets (1 to 9) and integrity checks. Fixture i uses presets[i % 11] and a CRC32 check when i is odd,
// CRC64 (xz's default) when it is even, so each kind is compressed three different ways and every preset
// and both checks are met.
const presets = [9, 1, 5, 9, 3, 7, 2, 9, 6, 4, 8]
const scales = [0.05, 0.3, 1]
const originals = [], used = []
const check = (i) => (i % 2 ? 'crc32' : 'crc64')
for (let i = 0; i < 45; i++) {
  const k = kinds[i % kinds.length], scale = scales[Math.floor(i / kinds.length)]
  originals.push(k.make(rng(9000 + i), Math.max(2, Math.round(k.n * scale * (1 + (i % 3) * 0.1)))))
  used.push({ preset: presets[i % presets.length], check: check(i), blockSize: 0 })
}
// Two inputs longer than one block, so the decoder also goes from block to block inside one stream:
// about 320 KB of prose and JSON at preset 6 in 100 KiB blocks, and about 250 KB of mixed content at
// preset 3 in 64 KiB blocks. Then an empty stream and a one-byte one.
originals.push(Buffer.concat([kinds[0].make(rng(9100), 55000), kinds[1].make(rng(9101), 1000)]), kinds[10].make(rng(9102), 700))
used.push({ preset: 6, check: 'crc64', blockSize: 102400 }, { preset: 3, check: 'crc32', blockSize: 65536 })
originals.push(Buffer.alloc(0), Buffer.from('x'))
used.push({ preset: 9, check: 'crc64', blockSize: 0 }, { preset: 1, check: 'crc32', blockSize: 0 })
// The dictionary of each stream is the smallest power of two that holds its input (4 KiB at least), not
// the preset's own (1 MiB at preset 1 up to 64 MiB at preset 9): a decoder sizes its buffer from the
// size written in the stream, and with the preset's size a one-shot decode of a 2 KB stream would be
// timed allocating up to 64 MiB. Everything else of the preset (match finder, mode, nice length, depth)
// is kept. This is what the xz manual advises (a dictionary larger than the file wastes memory).
const dictOf = (n) => { let d = 4096; while (d < n) d *= 2; return d }
// The compressed streams are recorded, not made at load: no JavaScript runtime has an xz encoder (or
// decoder). They were written once by the xz command (XZ Utils, liblzma, the reference implementation)
// with `node scenario.mjs --record`, which overwrites streams.bin and streams.json; one single-stream
// .xz file per fixture, LZMA2 as the only filter, single-threaded. The expected value is the original
// data regenerated from fixed seeds, never a decoder's output; streams.json also holds the originals'
// SHA-256 so a change to the generators is caught at load.
// The JavaScript runner loads a copy of this file under .cache/work/, inside the repository, so the
// recorded files are looked for beside it first and then in this task's folder from each parent up.
const TASK = path.join('benchmarks', 'block-compression', 'xz-decompress')
const here = (name) => {
  let dir = path.dirname(fileURLToPath(import.meta.url))
  if (existsSync(path.join(dir, name))) return path.join(dir, name)
  for (; ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, TASK, name))) return path.join(dir, TASK, name)
    if (path.dirname(dir) === dir) throw new Error(`${name} not found beside the scenario or in ${TASK}`)
  }
}
const sha256 = (b) => createHash('sha256').update(b).digest('hex')
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === '--record') {
  const version = spawnSync('xz', ['--version'], { encoding: 'utf8' }).stdout.split('\n')[0]
  const streams = originals.map((b, i) => {
    const { preset, check, blockSize } = used[i]
    const args = ['-c', '-T1', '--format=xz', `--check=${check}`, `--lzma2=preset=${preset},dict=${dictOf(b.length)}`]
    if (blockSize) args.push(`--block-size=${blockSize}`)
    const run = spawnSync('xz', args, { input: b, maxBuffer: 1 << 26 })
    if (run.status !== 0) throw new Error(`xz failed on fixture ${i}: ${run.stderr}`)
    const back = spawnSync('xz', ['-dc', '--single-stream'], { input: run.stdout, maxBuffer: 1 << 26 })
    if (back.status !== 0 || !back.stdout.equals(b)) throw new Error(`fixture ${i} does not decompress to its input`)
    return run.stdout
  })
  const all = Buffer.concat(streams)
  const beside = (name) => path.join(path.dirname(fileURLToPath(import.meta.url)), name)
  writeFileSync(beside('streams.bin'), all)
  writeFileSync(beside('streams.json'), JSON.stringify({ recordedWith: version, sha256: sha256(all), originals: sha256(Buffer.concat(originals)), lengths: streams.map((s) => s.length), settings: used }, null, 1) + '\n')
  console.log(`recorded ${streams.length} streams, ${all.length} bytes`)
  process.exit(0)
}
const recorded = JSON.parse(readFileSync(here('streams.json'), 'utf8'))
const all = readFileSync(here('streams.bin'))
assert.equal(sha256(all), recorded.sha256, 'streams.bin does not match streams.json')
assert.equal(sha256(Buffer.concat(originals)), recorded.originals, 'the regenerated originals differ from those the streams were recorded from')
assert.equal(recorded.lengths.length, originals.length, 'one recorded stream per fixture')
assert.deepEqual(recorded.settings, used, 'streams were recorded with other settings')
const streams = []
for (let i = 0, at = 0; i < recorded.lengths.length; at += recorded.lengths[i++]) streams.push(all.subarray(at, at + recorded.lengths[i]))
// Not timed, at load: every stream is exactly one .xz stream (header, blocks, index, footer, nothing
// before or after), with the fixture's check, and every block has LZMA2 as its only filter with the
// fixture's dictionary size. The index (found from the footer) lists the blocks.
const MAGIC = Buffer.from('fd377a585a00', 'hex'), CHECK = { crc32: 1, crc64: 4 }
const varint = (b, at) => { let v = 0, shift = 0, c; do { c = b[at++]; v += (c & 0x7f) * 2 ** shift; shift += 7 } while (c & 0x80); return [v, at] }
const dictFromProp = (p) => p === 40 ? 0xffffffff : (2 | (p & 1)) * 2 ** (Math.floor(p / 2) + 11)
for (const [i, s] of streams.entries()) {
  const { check, blockSize } = used[i]
  assert.ok(s.subarray(0, 6).equals(MAGIC), `stream ${i}: header magic`)
  assert.deepEqual([s[6], s[7]], [0, CHECK[check]], `stream ${i}: stream flags (${check})`)
  assert.equal(s.subarray(-2).toString('latin1'), 'YZ', `stream ${i}: footer magic`)
  assert.deepEqual([s.at(-4), s.at(-3)], [0, CHECK[check]], `stream ${i}: footer flags`)
  assert.equal(s.indexOf(MAGIC, 6), -1, `stream ${i}: a single stream`)
  const indexSize = (s.readUInt32LE(s.length - 8) + 1) * 4, indexAt = s.length - 12 - indexSize
  assert.equal(s[indexAt], 0, `stream ${i}: index indicator`)
  let [count, at] = varint(s, indexAt + 1)
  const expectedBlocks = originals[i].length === 0 ? 0 : blockSize ? Math.ceil(originals[i].length / blockSize) : 1
  assert.equal(count, expectedBlocks, `stream ${i}: number of blocks`)
  let block = 12, total = 0
  for (let n = 0; n < count; n++) {
    let unpadded, size;
    [unpadded, at] = varint(s, at);
    [size, at] = varint(s, at)
    total += size
    const flags = s[block + 1]
    assert.equal(flags & 3, 0, `stream ${i}, block ${n}: one filter`)
    let f = block + 2
    if (flags & 0x40) f = varint(s, f)[1]
    if (flags & 0x80) f = varint(s, f)[1]
    assert.deepEqual([s[f], s[f + 1]], [0x21, 1], `stream ${i}, block ${n}: LZMA2 filter`)
    assert.equal(dictFromProp(s[f + 2]), dictOf(originals[i].length), `stream ${i}, block ${n}: dictionary size`)
    block += Math.ceil(unpadded / 4) * 4
  }
  assert.equal(total, originals[i].length, `stream ${i}: the index's sizes`)
  assert.equal(block, indexAt, `stream ${i}: blocks end where the index starts`)
}
// Fixtures travel as JSON, so the stream and the expected bytes are "binary strings": one character
// (U+0000 to U+00FF) per byte. Every adapter turns the input into bytes in an untimed prepare.
export const cases = streams.map((s, i) => ({ input: s.toString('latin1'), expected: originals[i].toString('latin1') }))
// A correct output is exactly the original bytes. Native runners send them as a binary string
// (describe, or Go's MarshalJSON, outside timing); JavaScript outputs are converted in verify.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.equal(typeof output, 'string', `fixture ${i}: the decompressed bytes as a binary string are required`)
    assert.equal(output.length, expected.length, `fixture ${i}: decompressed length`)
    assert.ok(output === expected, `fixture ${i}: decompressed bytes differ from the original`)
  }
}
const binary = (i, value) => {
  assert.ok(value instanceof Uint8Array, `fixture ${i}: the decompressed bytes (a Uint8Array or Buffer) are required`)
  return Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('latin1')
}
export const verify = (operation) => verifyResults(cases.map(({ input }, i) => binary(i, operation(input))))
export const consume = (value) => value.length
// The check refuses outputs that did not do the job.
verifyResults(cases.map(({ expected }) => expected))
const flip = (s, at) => s.slice(0, at) + String.fromCharCode(s.charCodeAt(at) ^ 1) + s.slice(at + 1)
const wrong = {
  'the stream unchanged': cases.map(({ input }) => input),
  'one byte short': cases.map(({ expected }) => expected.slice(0, Math.max(0, expected.length - 1))),
  'one byte more': cases.map(({ expected }) => expected + '\0'),
  'one bit flipped in the middle': cases.map(({ expected }) => expected.length ? flip(expected, expected.length >> 1) : 'x'),
  'the last block missing': cases.map(({ expected }) => expected.slice(0, Math.floor(expected.length * 0.9))),
  'text decoded as UTF-8': cases.map(({ expected }) => Buffer.from(expected, 'latin1').toString('utf8')),
  "another fixture's bytes": cases.map((_, i) => cases[(i + 1) % cases.length].expected),
  'empty bytes': cases.map(() => ''),
  'a list of byte values': cases.map(({ expected }) => [...Buffer.from(expected, 'latin1')]),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
assert.throws(() => verify(() => 'not bytes'), undefined, 'a string result must be refused')
