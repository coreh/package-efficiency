import { strict as assert } from 'node:assert'

// Independent QR decoder used only to check results: it reads the module
// matrix back (format info, unmasking, de-interleaving, Reed-Solomon syndromes,
// segment decoding) and must recover the exact input text.

// Index 0 = L, 1 = M, 2 = Q, 3 = H (the order of the requested level).
const ECC_PER_BLOCK = [
  [NaN, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [NaN, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [NaN, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [NaN, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
]
const ECC_BLOCKS = [
  [NaN, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [NaN, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [NaN, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [NaN, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
]
// Two-bit level indicator in the format information, by level index L, M, Q, H.
const FORMAT_BITS = [1, 0, 3, 2]
const LEVEL_OF_FORMAT = [1, 0, 3, 2]

const EXP = new Uint8Array(512)
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; x <<= 1; if (x & 256) x ^= 0x11d }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
const LOG = new Uint8Array(256)
for (let i = 0; i < 255; i++) LOG[EXP[i]] = i
const gfMul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

const bchFormat = (data) => {
  let rem = data
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
  return ((data << 10) | rem) ^ 0x5412
}
const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]
const ALNUM = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'

// Returns { version, level, text } or throws. `offset` is the quiet zone width
// the matrix carries on each side.
function decode(matrix, offset) {
  const size = matrix.length - 2 * offset
  assert.ok(size >= 21 && size <= 177 && (size - 17) % 4 === 0, `bad size ${size}`)
  for (const row of matrix) assert.equal(row.length, matrix.length, 'matrix must be square')
  const version = (size - 17) / 4
  const get = (x, y) => (matrix[y + offset][x + offset] ? 1 : 0)
  // Quiet zone, when present, is light.
  for (let i = 0; i < matrix.length; i++) for (let k = 0; k < offset; k++) {
    assert.ok(!matrix[k][i] && !matrix[matrix.length - 1 - k][i] && !matrix[i][k] && !matrix[i][matrix.length - 1 - k], 'quiet zone must be light')
  }
  // Function patterns.
  const isFn = Array.from({ length: size }, () => new Uint8Array(size))
  const mark = (x0, y0, x1, y1) => { for (let y = Math.max(0, y0); y <= Math.min(size - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(size - 1, x1); x++) isFn[y][x] = 1 }
  mark(0, 0, 8, 8); mark(size - 8, 0, size - 1, 8); mark(0, size - 8, 8, size - 1)
  for (let i = 0; i < size; i++) { isFn[6][i] = 1; isFn[i][6] = 1 }
  const na = version === 1 ? 0 : Math.floor(version / 7) + 2
  const pos = [6]
  if (na) {
    const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (na * 2 - 2)) * 2
    for (let p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p)
  }
  for (let i = 0; i < pos.length; i++) for (let j = 0; j < pos.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue
    mark(pos[i] - 2, pos[j] - 2, pos[i] + 2, pos[j] + 2)
  }
  if (version >= 7) { mark(size - 11, 0, size - 9, 5); mark(0, size - 11, 5, size - 9) }
  // Finder patterns and timing patterns.
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy
      if (x < 0 || y < 0 || x >= size || y >= size) continue
      const d = Math.max(Math.abs(dx), Math.abs(dy))
      assert.equal(get(x, y), d === 4 || d === 2 ? 0 : 1, `finder at ${x},${y}`)
    }
  }
  for (let i = 8; i < size - 8; i++) { assert.equal(get(i, 6), i % 2 === 0 ? 1 : 0, 'timing row'); assert.equal(get(6, i), i % 2 === 0 ? 1 : 0, 'timing column') }
  assert.equal(get(8, size - 8), 1, 'dark module')
  // Format information, both copies.
  let f1 = 0
  for (let i = 0; i <= 5; i++) f1 |= get(8, i) << i
  f1 |= get(8, 7) << 6; f1 |= get(8, 8) << 7; f1 |= get(7, 8) << 8
  for (let i = 9; i < 15; i++) f1 |= get(14 - i, 8) << i
  let f2 = 0
  for (let i = 0; i < 8; i++) f2 |= get(size - 1 - i, 8) << i
  for (let i = 8; i < 15; i++) f2 |= get(8, size - 15 + i) << i
  assert.equal(f1, f2, 'format copies differ')
  const formatData = (f1 ^ 0x5412) >>> 10
  assert.equal(bchFormat(formatData), f1, 'format BCH')
  const level = LEVEL_OF_FORMAT.indexOf(formatData >>> 3)
  const mask = formatData & 7
  // Version information.
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const want = (version << 12) | rem
    let v1 = 0
    for (let i = 0; i < 18; i++) v1 |= get(Math.floor(i / 3), size - 11 + (i % 3)) << i
    assert.equal(v1, want, 'version info')
  }
  // Data bits in zigzag order.
  const nAlign = version === 1 ? 0 : Math.floor(version / 7) + 2
  const rawModules = (16 * version + 128) * version + 64 - (nAlign ? 25 * nAlign * nAlign - 10 * nAlign - 55 : 0) - (version >= 7 ? 36 : 0)
  const rawCodewords = Math.floor(rawModules / 8)
  const bytes = new Uint8Array(rawCodewords)
  let bitIndex = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j
      const y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert
      if (isFn[y][x] || bitIndex >= rawCodewords * 8) continue
      const bit = get(x, y) ^ (MASKS[mask](x, y) ? 1 : 0)
      bytes[bitIndex >>> 3] |= bit << (7 - (bitIndex & 7))
      bitIndex++
    }
  }
  assert.equal(bitIndex, rawCodewords * 8, 'data module count')
  // De-interleave and check Reed-Solomon.
  const nBlocks = ECC_BLOCKS[level][version], eccLen = ECC_PER_BLOCK[level][version]
  const shortLen = Math.floor(rawCodewords / nBlocks), nShort = nBlocks - (rawCodewords % nBlocks)
  const blocks = Array.from({ length: nBlocks }, () => [])
  for (let i = 0, k = 0; i < shortLen + 1; i++) for (let j = 0; j < nBlocks; j++) {
    if (i !== shortLen - eccLen || j >= nShort) blocks[j].push(bytes[k++])
  }
  const data = []
  for (const block of blocks) {
    for (let s = 0; s < eccLen; s++) {
      let acc = 0
      for (const b of block) acc = gfMul(acc, EXP[s]) ^ b
      assert.equal(acc, 0, 'Reed-Solomon syndrome')
    }
    for (let i = 0; i < block.length - eccLen; i++) data.push(block[i])
  }
  // Segments.
  let p = 0
  const read = (n) => { let v = 0; for (let i = 0; i < n; i++, p++) v = (v << 1) | ((data[p >>> 3] >>> (7 - (p & 7))) & 1); return v }
  const total = data.length * 8
  const w = (a, b, c) => (version <= 9 ? a : version <= 26 ? b : c)
  let text = ''
  let raw = []
  const flush = () => { if (raw.length) { text += new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw)); raw = [] } }
  while (total - p >= 4) {
    const mode = read(4)
    if (mode === 0) break
    if (mode === 7) { const b = read(8); if (b & 0x80) read((b & 0x40) ? 16 : 8); continue }
    if (mode === 1) {
      flush()
      let n = read(w(10, 12, 14))
      while (n >= 3) { text += String(read(10)).padStart(3, '0'); n -= 3 }
      if (n === 2) text += String(read(7)).padStart(2, '0')
      else if (n === 1) text += String(read(4))
    } else if (mode === 2) {
      flush()
      let n = read(w(9, 11, 13))
      while (n >= 2) { const v = read(11); text += ALNUM[Math.floor(v / 45)] + ALNUM[v % 45]; n -= 2 }
      if (n === 1) text += ALNUM[read(6)]
    } else if (mode === 4) {
      let n = read(w(8, 16, 16))
      while (n-- > 0) raw.push(read(8))
    } else assert.fail(`unsupported mode ${mode}`)
  }
  flush()
  return { version, level, text }
}

const check = (matrix, text, level, label) => {
  assert.ok(Array.isArray(matrix), `${label}: matrix array required`)
  let result, firstError
  // The matrix may or may not include a light quiet zone (0 or 2 modules).
  for (const offset of [0, 2]) {
    try { result = decode(matrix, offset); break } catch (e) { firstError ??= e }
  }
  if (!result) throw firstError
  assert.equal(result.text, text, `${label}: decoded text`)
  // A library may raise the level when it fits in the same version, never lower it.
  assert.ok(result.level >= level, `${label}: error correction level ${result.level} below requested ${level}`)
}

// Deterministic fixtures: [text, level] with level 0..3 for L, M, Q, H.
const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa']
const sentence = (n, seed) => Array.from({ length: n }, (_, i) => words[(i * 7 + seed * 3) % words.length]).join(' ')
const hexId = (n, seed) => Array.from({ length: n }, (_, i) => ((i * 2654435761 + seed * 40503) >>> 7 & 15).toString(16)).join('')
const digits = (n, seed) => Array.from({ length: n }, (_, i) => ((i * 31 + seed * 17 + (i >> 2)) % 10)).join('')
const items = []
const add = (text, level) => items.push({ text, level })
const hosts = ['example.com', 'shop.example.org', 'docs.rust-lang.org', 'github.com', 'app.mycompany.io', 'www.wikipedia.org']
for (let i = 0; i < 12; i++) {
  const host = hosts[i % hosts.length]
  add(`https://${host}/${['p', 'item', 'u', 'article', 'track'][i % 5]}/${hexId(4 + i * 2, i)}?utm_source=qr&utm_campaign=${words[i]}`, i % 4)
}
for (let i = 0; i < 4; i++) add(`https://${hosts[i]}`, i)
for (let i = 0; i < 6; i++) add(`https://maps.example.com/place/${words[i]}+${words[i + 3]}/@${(-23.5 + i * 0.37).toFixed(5)},${(-46.6 + i * 0.21).toFixed(5)},17z/data=!3m1!4b1`, (i + 1) % 4)
for (let i = 0; i < 5; i++) add(digits(8 + i * 9, i), i % 4)
for (let i = 0; i < 5; i++) add(`HTTPS://${hosts[i].toUpperCase()}/${hexId(6 + i * 3, i).toUpperCase()}`, (i + 2) % 4)
for (let i = 0; i < 4; i++) add(`TICKET ${hexId(10 + i * 4, i + 9).toUpperCase()} SEAT ${i + 10}${'ABCD'[i]} GATE ${i * 3 + 1}`, i)
for (let i = 0; i < 4; i++) add(`WIFI:T:WPA;S:${words[i]}-guest-${i};P:${hexId(16 + i * 2, i + 3)};;`, i % 2 ? 2 : 1)
for (let i = 0; i < 3; i++) add(`BEGIN:VCARD\nVERSION:3.0\nN:${words[i + 5]};${words[i]}\nFN:${words[i]} ${words[i + 5]}\nORG:${hosts[i]}\nTEL;TYPE=CELL:+55119${digits(8, i)}\nEMAIL:${words[i]}@${hosts[i]}\nEND:VCARD`, 1 + i % 2)
for (let i = 0; i < 3; i++) add(`mailto:${words[i]}@${hosts[i]}?subject=${encodeURIComponent('Hello ' + words[i + 4])}&body=${encodeURIComponent(sentence(6, i))}`, i)
for (let i = 0; i < 4; i++) add(['Olá, mundo! Café com açúcar', '日本語のテキストをエンコード', 'Привет, мир! QR-код 😀', 'Ünïcödé — “quotes” and emoji 🎉🚀'][i] + ` #${i}`, i)
for (let i = 0; i < 4; i++) add(sentence(8 + i * 14, i), (i + 1) % 4)
add(sentence(80, 5), 0)
add(sentence(70, 6), 1)
add('a', 3)
add('0', 0)
add('Q', 2)
export const cases = items.map(({ text, level }) => ({ input: { text, level } }))
export const fixtureCount = cases.length

// Rust-free task: only JavaScript adapters submit results here.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) check(outputs[i], input.text, input.level, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
