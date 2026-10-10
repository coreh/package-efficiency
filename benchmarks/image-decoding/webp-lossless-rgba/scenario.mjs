import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'
// Deterministic lossless WebP files (simple format: RIFF, WEBP, one VP8L chunk), written by the scenario
// itself after RFC 9649: canonical prefix codes built from the symbol counts, LZ77 backward references
// (with the 120 two-dimensional distance codes), a colour cache, meta prefix codes, and the four transforms.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296

// Bits are written least significant first (RFC 9649 section 3.3).
class BitWriter {
  constructor () { this.out = []; this.acc = 0; this.n = 0 }
  write (value, bits) {
    while (bits > 16) { this.write(value & 0xffff, 16); value = Math.floor(value / 65536); bits -= 16 }
    this.acc |= (value & ((1 << bits) - 1)) << this.n; this.n += bits
    while (this.n >= 8) { this.out.push(this.acc & 255); this.acc >>>= 8; this.n -= 8 }
  }
  bytes () { const out = [...this.out]; if (this.n > 0) out.push(this.acc & 255); return Buffer.from(out) }
}

// Prefix-code lengths from symbol counts (two-queue Huffman, ties broken by symbol), no longer than `limit`:
// while a code is too long the counts are halved (never below one), which ends at a balanced tree.
const huffmanLengths = (freq, limit) => {
  let f = Array.from(freq)
  for (;;) {
    const leaves = []
    for (let s = 0; s < f.length; s++) if (f[s] > 0) leaves.push(s)
    leaves.sort((a, b) => f[a] - f[b] || a - b)
    const n = leaves.length, weight = leaves.map((s) => f[s]), parent = new Int32Array(2 * n)
    let li = 0, ii = n, next = n
    const pick = () => li < n && (ii >= next || weight[li] <= weight[ii]) ? li++ : ii++
    while (next < 2 * n - 1) { const a = pick(), b = pick(); weight[next] = weight[a] + weight[b]; parent[a] = parent[b] = next; next++ }
    const depth = new Int32Array(next), lengths = new Uint8Array(f.length)
    let max = 0
    for (let k = next - 2; k >= 0; k--) depth[k] = depth[parent[k]] + 1
    for (let k = 0; k < n; k++) { lengths[leaves[k]] = depth[k]; max = Math.max(max, depth[k]) }
    if (max <= limit) return lengths
    f = f.map((v) => v > 0 ? Math.max(1, v >> 1) : 0)
  }
}
// Canonical codes, shorter codes first and symbols in order within a length, bit-reversed for the LSB-first writer.
const canonicalCodes = (lengths) => {
  const count = new Array(16).fill(0), next = new Array(16).fill(0), codes = new Uint32Array(lengths.length)
  for (const l of lengths) if (l) count[l]++
  for (let b = 1, code = 0; b <= 15; b++) { code = (code + count[b - 1] * (b > 1)) << 1; next[b] = code }
  for (let s = 0; s < lengths.length; s++) {
    const l = lengths[s]
    if (!l) continue
    let c = next[l]++, r = 0
    for (let k = 0; k < l; k++) { r = (r << 1) | (c & 1); c >>= 1 }
    codes[s] = r
  }
  return codes
}
const CODE_LENGTH_ORDER = [17, 18, 0, 1, 2, 3, 4, 5, 16, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
// Writes one prefix code (section 3.7.2.1) for the given counts and returns { lengths, codes } for the data.
// Up to two used symbols below 256: the simple code (the smaller symbol first, so every reading of the
// specification gives it code 0). Otherwise the normal code: lengths run-length coded with 16, 17 and 18,
// themselves prefix-coded, with `max_symbol` written when trailing zeros can be dropped and `useMaxSymbol` asks.
const writePrefixCode = (bw, freq, useMaxSymbol) => {
  const used = []
  for (let s = 0; s < freq.length; s++) if (freq[s] > 0) used.push(s)
  if (used.length <= 2 && used.every((s) => s < 256)) {
    const symbols = used.length ? used : [0], lengths = new Uint8Array(freq.length)
    bw.write(1, 1); bw.write(symbols.length - 1, 1)
    if (symbols[0] < 2) { bw.write(0, 1); bw.write(symbols[0], 1) } else { bw.write(1, 1); bw.write(symbols[0], 8) }
    if (symbols.length === 2) { bw.write(symbols[1], 8); lengths[symbols[0]] = lengths[symbols[1]] = 1 }
    return { lengths, codes: canonicalCodes(lengths) }
  }
  const counts = Array.from(freq)
  if (used.length === 1) counts[used[0] === 0 ? 1 : 0] = 1 // a lone symbol of 256 and up gets a partner: no one-symbol trees
  const lengths = huffmanLengths(counts, 15)
  let end = lengths.length
  if (useMaxSymbol) while (lengths[end - 1] === 0) end--
  const tokens = [] // [symbol, extra bits value]
  for (let i = 0; i < end;) {
    const v = lengths[i]
    let run = 1
    while (i + run < end && lengths[i + run] === v) run++
    if (v === 0) {
      let left = run
      while (left >= 11) { const k = Math.min(left, 138); tokens.push([18, k - 11]); left -= k }
      if (left >= 3) { tokens.push([17, left - 3]); left = 0 }
      while (left-- > 0) tokens.push([0, 0])
    } else {
      tokens.push([v, 0])
      let left = run - 1
      while (left >= 3) { const k = Math.min(left, 6); tokens.push([16, k - 3]); left -= k }
      while (left-- > 0) tokens.push([v, 0])
    }
    i += run
  }
  const clFreq = new Array(19).fill(0)
  for (const [s] of tokens) clFreq[s]++
  if (clFreq.filter((c) => c > 0).length === 1) clFreq[clFreq.findIndex((c) => c === 0)] = 1 // never a one-symbol tree
  const clLengths = huffmanLengths(clFreq, 7), clCodes = canonicalCodes(clLengths)
  let numCodes = 19
  while (numCodes > 4 && clLengths[CODE_LENGTH_ORDER[numCodes - 1]] === 0) numCodes--
  bw.write(0, 1); bw.write(numCodes - 4, 4)
  for (let k = 0; k < numCodes; k++) bw.write(clLengths[CODE_LENGTH_ORDER[k]], 3)
  if (end < lengths.length) {
    let k = 0
    while (tokens.length - 2 >= 2 ** (2 + 2 * k)) k++
    bw.write(1, 1); bw.write(k, 3); bw.write(tokens.length - 2, 2 + 2 * k)
  } else bw.write(0, 1)
  for (const [s, extra] of tokens) {
    bw.write(clCodes[s], clLengths[s])
    if (s === 16) bw.write(extra, 2); else if (s === 17) bw.write(extra, 3); else if (s === 18) bw.write(extra, 7)
  }
  return { lengths, codes: canonicalCodes(lengths) }
}

// LZ77 lengths and distances as a prefix symbol plus extra bits (section 3.6.3.2).
const prefixOf = (v) => {
  const d = v - 1
  if (d < 4) return [d, 0, 0]
  const h = 31 - Math.clz32(d), s = (d >> (h - 1)) & 1
  return [2 * h + s, h - 1, d & ((1 << (h - 1)) - 1)]
}
// The 120 two-dimensional distance codes (section 3.6.3.3), as (xi, yi): distance xi + yi * width.
const PLANE = [
  0, 1, 1, 0, 1, 1, -1, 1, 0, 2, 2, 0, 1, 2, -1, 2, 2, 1, -2, 1, 2, 2, -2, 2, 0, 3, 3, 0, 1, 3, -1, 3, 3, 1, -3, 1, 2, 3, -2, 3, 3, 2,
  -3, 2, 0, 4, 4, 0, 1, 4, -1, 4, 4, 1, -4, 1, 3, 3, -3, 3, 2, 4, -2, 4, 4, 2, -4, 2, 0, 5, 3, 4, -3, 4, 4, 3, -4, 3, 5, 0, 1, 5,
  -1, 5, 5, 1, -5, 1, 2, 5, -2, 5, 5, 2, -5, 2, 4, 4, -4, 4, 3, 5, -3, 5, 5, 3, -5, 3, 0, 6, 6, 0, 1, 6, -1, 6, 6, 1, -6, 1, 2, 6,
  -2, 6, 6, 2, -6, 2, 4, 5, -4, 5, 5, 4, -5, 4, 3, 6, -3, 6, 6, 3, -6, 3, 0, 7, 7, 0, 1, 7, -1, 7, 5, 5, -5, 5, 7, 1, -7, 1, 4, 6,
  -4, 6, 6, 4, -6, 4, 2, 7, -2, 7, 7, 2, -7, 2, 3, 7, -3, 7, 7, 3, -7, 3, 5, 6, -5, 6, 6, 5, -6, 5, 8, 0, 4, 7, -4, 7, 7, 4, -7, 4,
  8, 1, 8, 2, 6, 6, -6, 6, 8, 3, 5, 7, -5, 7, 7, 5, -7, 5, 8, 4, 6, 7, -6, 7, 7, 6, -7, 6, 8, 5, 7, 7, -7, 7, 8, 6, 8, 7,
]
const planeCodes = (w) => {
  const map = new Map()
  for (let c = 0; c < 120; c++) { const d = PLANE[2 * c] + PLANE[2 * c + 1] * w; if (d >= 1 && !map.has(d)) map.set(d, c + 1) }
  return map
}
const cacheIndex = (argb, bits) => Math.imul(argb, 0x1e35a7bd) >>> (32 - bits)

// One entropy-coded image (section 3.7): colour cache info, meta prefix codes (main image only), the five
// prefix codes of each group, then the symbols. `px` holds ARGB values.
const writeImage = (bw, px, w, h, { cacheBits = 0, lz77 = false, metaBits = 0, groups = 1, maxSymbol = false, main = false } = {}) => {
  const n = px.length, tokens = []
  const cache = cacheBits ? new Uint32Array(1 << cacheBits) : null, cacheHas = cacheBits ? new Uint8Array(1 << cacheBits) : null
  const remember = (argb) => { if (cache) { const k = cacheIndex(argb, cacheBits); cache[k] = argb; cacheHas[k] = 1 } }
  const plane = planeCodes(w), head = new Map(), prev = new Int32Array(n).fill(-1)
  const key = (i) => (Math.imul(px[i], 0x9e3779b1) ^ px[i + 1]) >>> 0
  const insert = (i) => { if (i + 1 < n) { const k = key(i), p = head.get(k); prev[i] = p === undefined ? -1 : p; head.set(k, i) } }
  for (let i = 0; i < n;) {
    let bestLen = 0, bestDist = 0
    if (lz77) {
      const tryDist = (d) => {
        if (d < 1 || d > i) return
        let l = 0
        const max = Math.min(4096, n - i)
        while (l < max && px[i + l] === px[i + l - d]) l++
        if (l > bestLen) { bestLen = l; bestDist = d }
      }
      tryDist(1); tryDist(w)
      if (i + 1 < n) for (let p = head.get(key(i)), k = 0; p !== undefined && p >= 0 && k < 16; p = prev[p], k++) tryDist(i - p)
    }
    if (bestLen >= 3) {
      tokens.push({ at: i, len: bestLen, dist: plane.get(bestDist) ?? bestDist + 120 })
      for (let k = 0; k < bestLen; k++) { insert(i + k); remember(px[i + k]) }
      i += bestLen
    } else {
      const argb = px[i], k = cache ? cacheIndex(argb, cacheBits) : 0
      tokens.push(cache && cacheHas[k] && cache[k] === argb ? { at: i, cache: k } : { at: i, argb })
      insert(i); remember(argb); i++
    }
  }
  bw.write(cacheBits ? 1 : 0, 1)
  if (cacheBits) bw.write(cacheBits, 4)
  const tilesPerRow = metaBits ? Math.ceil(w / (1 << metaBits)) : 1
  const groupOf = (i) => metaBits ? (((i % w) >> metaBits) + 2 * (Math.floor(i / w) >> metaBits)) % groups : 0
  // The decoder reads as many groups as the largest index in the meta image says (a small image may not reach them all).
  let G = 1
  if (main) {
    bw.write(metaBits ? 1 : 0, 1)
    if (metaBits) {
      bw.write(metaBits - 2, 3)
      const tilesHigh = Math.ceil(h / (1 << metaBits)), meta = new Uint32Array(tilesPerRow * tilesHigh)
      for (let ty = 0; ty < tilesHigh; ty++) for (let tx = 0; tx < tilesPerRow; tx++) { const g = groupOf(ty * (1 << metaBits) * w + tx * (1 << metaBits)); meta[ty * tilesPerRow + tx] = g << 8; G = Math.max(G, g + 1) }
      writeImage(bw, meta, tilesPerRow, tilesHigh, { lz77: true })
    }
  }
  const sizes = [280 + (cacheBits ? 1 << cacheBits : 0), 256, 256, 256, 40]
  const hist = Array.from({ length: G }, () => sizes.map((s) => new Uint32Array(s)))
  for (const t of tokens) {
    const g = hist[groupOf(t.at)]
    if (t.argb !== undefined) { g[0][(t.argb >>> 8) & 255]++; g[1][(t.argb >>> 16) & 255]++; g[2][t.argb & 255]++; g[3][t.argb >>> 24]++ } else if (t.cache !== undefined) g[0][280 + t.cache]++
    else { g[0][256 + prefixOf(t.len)[0]]++; g[4][prefixOf(t.dist)[0]]++ }
  }
  const codes = hist.map((g) => g.map((f) => writePrefixCode(bw, f, maxSymbol)))
  const put = (c, s) => bw.write(c.codes[s], c.lengths[s])
  for (const t of tokens) {
    const c = codes[groupOf(t.at)]
    if (t.argb !== undefined) { put(c[0], (t.argb >>> 8) & 255); put(c[1], (t.argb >>> 16) & 255); put(c[2], t.argb & 255); put(c[3], t.argb >>> 24) } else if (t.cache !== undefined) put(c[0], 280 + t.cache)
    else {
      const [ls, lb, le] = prefixOf(t.len), [ds, db, de] = prefixOf(t.dist)
      put(c[0], 256 + ls); bw.write(le, lb); put(c[4], ds); bw.write(de, db)
    }
  }
}

// Per-channel arithmetic on ARGB words (as libwebp writes it).
const addPx = (a, b) => ((((a & 0xff00ff00) >>> 0) + ((b & 0xff00ff00) >>> 0)) & 0xff00ff00 | (((a & 0x00ff00ff) + (b & 0x00ff00ff)) & 0x00ff00ff)) >>> 0
const subPx = (a, b) => (((0x00ff00ff + ((a & 0xff00ff00) >>> 0) - ((b & 0xff00ff00) >>> 0)) & 0xff00ff00) | ((0xff00ff00 + (a & 0x00ff00ff) - (b & 0x00ff00ff)) & 0x00ff00ff)) >>> 0
const avg2 = (a, b) => ((((a ^ b) & 0xfefefefe) >>> 1) + ((a & b) >>> 0)) >>> 0
const ch = (p, s) => (p >>> s) & 255
const perChannel = (f) => (ch(f, 24) << 24 | ch(f, 16) << 16 | ch(f, 8) << 8 | ch(f, 0)) >>> 0
const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v
const select = (L, T, TL) => {
  let pL = 0, pT = 0
  for (const s of [24, 16, 8, 0]) { pL += Math.abs(ch(T, s) - ch(TL, s)); pT += Math.abs(ch(L, s) - ch(TL, s)) }
  return pL < pT ? L : T
}
const clampFull = (a, b, c) => [24, 16, 8, 0].reduce((p, s) => p | clamp(ch(a, s) + ch(b, s) - ch(c, s)) << s, 0) >>> 0
const clampHalf = (a, b) => [24, 16, 8, 0].reduce((p, s) => p | clamp(ch(a, s) + Math.trunc((ch(a, s) - ch(b, s)) / 2)) << s, 0) >>> 0
// The 14 predictors (section 4.1), from left, top, top-left and top-right.
const predict = (mode, L, T, TL, TR) => {
  switch (mode) {
    case 0: return 0xff000000
    case 1: return L
    case 2: return T
    case 3: return TR
    case 4: return TL
    case 5: return avg2(avg2(L, TR), T)
    case 6: return avg2(L, TL)
    case 7: return avg2(L, T)
    case 8: return avg2(TL, T)
    case 9: return avg2(T, TR)
    case 10: return avg2(avg2(L, TL), avg2(T, TR))
    case 11: return select(L, T, TL)
    case 12: return clampFull(L, T, TL)
    default: return clampHalf(avg2(L, T), TL)
  }
}
const predictionAt = (px, w, i, mode) => {
  const x = i % w
  if (i === 0) return 0xff000000
  if (i < w) return px[i - 1]
  if (x === 0) return px[i - w]
  // The top-right of the last column is the first pixel of the current row: px[i - w + 1] is exactly that.
  return predict(mode, px[i - 1], px[i - w], px[i - w - 1], px[i - w + 1])
}
const cost = (r) => { let c = 0; for (const s of [24, 16, 8, 0]) { const v = ch(r, s); c += v < 128 ? v : 256 - v } return c }
const tiles = (w, h, bits, f) => { const tw = Math.ceil(w / (1 << bits)), th = Math.ceil(h / (1 << bits)); const out = new Uint32Array(tw * th); for (let ty = 0; ty < th; ty++) for (let tx = 0; tx < tw; tx++) out[ty * tw + tx] = f(tx, ty, tw); return { out, tw, th } }
const tilePixels = (w, h, bits, tx, ty) => { const list = []; for (let y = ty << bits; y < Math.min(h, (ty + 1) << bits); y++) for (let x = tx << bits; x < Math.min(w, (tx + 1) << bits); x++) list.push(y * w + x); return list }

// Transforms (section 4), each applied forward to `px` and written in order; the decoder undoes them in reverse.
const subtractGreen = (bw, px) => {
  bw.write(1, 1); bw.write(2, 2)
  return px.map((p) => { const g = ch(p, 8); return ((p & 0xff00ff00) | ((ch(p, 16) - g) & 255) << 16 | ((p - g) & 255)) >>> 0 })
}
// mode 'best': the predictor with the smallest residuals in each tile; mode 'cycle': predictors 0 to 13 in turn.
const predictor = (bw, px, w, h, bits, choice) => {
  const { out: modes, tw, th } = tiles(w, h, bits, (tx, ty, tw) => {
    if (choice === 'cycle') return (ty * tw + tx) % 14
    let best = 0, bestCost = Infinity
    for (let m = 0; m < 14; m++) {
      let c = 0
      for (const i of tilePixels(w, h, bits, tx, ty)) c += cost(subPx(px[i], predictionAt(px, w, i, m)))
      if (c < bestCost) { best = m; bestCost = c }
    }
    return best
  })
  bw.write(1, 1); bw.write(0, 2); bw.write(bits - 2, 3)
  writeImage(bw, modes.map((m) => (0xff000000 | m << 8) >>> 0), tw, th, { lz77: true })
  return px.map((p, i) => subPx(p, predictionAt(px, w, i, modes[((Math.floor(i / w) >> bits) * tw) + ((i % w) >> bits)])))
}
const delta = (t, c) => ((t << 24 >> 24) * (c << 24 >> 24)) >> 5
const crossColour = (bw, px, w, h, bits) => {
  const candidates = Array.from({ length: 33 }, (_, k) => (k - 16) * 4)
  const best = (list, f) => { let b = 0, bc = Infinity; for (const c of candidates) { let s = 0; for (const i of list) s += f(c, i); if (s < bc) { b = c; bc = s } } return b & 255 }
  const signed = (v) => { v &= 255; return v < 128 ? v : 256 - v }
  const { out: elems, tw, th } = tiles(w, h, bits, (tx, ty) => {
    const list = tilePixels(w, h, bits, tx, ty)
    const g2r = best(list, (c, i) => signed(ch(px[i], 16) - delta(c, ch(px[i], 8))))
    const g2b = best(list, (c, i) => signed(ch(px[i], 0) - delta(c, ch(px[i], 8))))
    const r2b = best(list, (c, i) => signed(ch(px[i], 0) - delta(g2b, ch(px[i], 8)) - delta(c, ch(px[i], 16))))
    return (0xff000000 | r2b << 16 | g2b << 8 | g2r) >>> 0
  })
  bw.write(1, 1); bw.write(1, 2); bw.write(bits - 2, 3)
  writeImage(bw, elems, tw, th, { lz77: true })
  return px.map((p, i) => {
    const e = elems[((Math.floor(i / w) >> bits) * tw) + ((i % w) >> bits)], r = ch(p, 16), g = ch(p, 8), b = ch(p, 0)
    const nr = (r - delta(ch(e, 0), g)) & 255, nb = (b - delta(ch(e, 8), g) - delta(ch(e, 16), r)) & 255
    return ((p & 0xff00ff00) | nr << 16 | nb) >>> 0
  })
}
// The palette in order of first appearance, delta-coded; indices bundled 8, 4 or 2 to a pixel when they fit.
const colourIndexing = (bw, px, w) => {
  const palette = [...new Set(px)], index = new Map(palette.map((c, k) => [c, k]))
  const bits = palette.length <= 2 ? 3 : palette.length <= 4 ? 2 : palette.length <= 16 ? 1 : 0
  bw.write(1, 1); bw.write(3, 2); bw.write(palette.length - 1, 8)
  writeImage(bw, Uint32Array.from(palette, (c, k) => k ? subPx(c, palette[k - 1]) : c), palette.length, 1, { lz77: true })
  const per = 1 << bits, nw = Math.ceil(w / per), h = px.length / w, out = new Uint32Array(nw * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = y * nw + (x >> bits)
      out[o] = (out[o] | index.get(px[y * w + x]) << (8 + (x & (per - 1)) * (8 >> bits))) >>> 0
    }
    for (let x = 0; x < nw; x++) out[y * nw + x] = (out[y * nw + x] | 0xff000000) >>> 0
  }
  return { px: out, w: nw }
}

const encodeWebp = (rgba, w, h, opaque, cfg) => {
  let px = new Uint32Array(w * h), cw = w
  for (let i = 0; i < w * h; i++) px[i] = (rgba[i * 4 + 3] << 24 | rgba[i * 4] << 16 | rgba[i * 4 + 1] << 8 | rgba[i * 4 + 2]) >>> 0
  const bw = new BitWriter()
  bw.write(0x2f, 8); bw.write(w - 1, 14); bw.write(h - 1, 14); bw.write(opaque ? 0 : 1, 1); bw.write(0, 3)
  const undone = {}
  if (cfg.palette) ({ px, w: cw } = colourIndexing(bw, px, w))
  if (cfg.sg) { px = subtractGreen(bw, px); undone.sg = px }
  if (cfg.pred) px = predictor(bw, px, cw, h, cfg.predBits, cfg.pred)
  if (cfg.cc) px = crossColour(bw, px, cw, h, cfg.ccBits)
  bw.write(0, 1)
  if (!cfg.palette && (cfg.sg || cfg.pred || cfg.cc)) undone.all = px
  writeImage(bw, px, cw, h, { cacheBits: cfg.cache ?? 0, lz77: !!cfg.lz77, metaBits: cfg.metaBits ?? 0, groups: cfg.groups ?? 1, maxSymbol: !!cfg.maxSymbol, main: true })
  const data = bw.bytes(), pad = data.length % 2
  const header = Buffer.alloc(20)
  header.write('RIFF', 0, 'latin1'); header.writeUInt32LE(12 + data.length + pad, 4); header.write('WEBPVP8L', 8, 'latin1'); header.writeUInt32LE(data.length, 16)
  return { file: Buffer.concat([header, data, Buffer.alloc(pad)]), undone }
}

const painters = [
  // smooth two-axis gradient
  (w, h) => (x, y) => [x * 255 / w, y * 255 / h, (x + y) & 255, 255],
  // large flat blocks, four colours
  (w, h) => (x, y) => [[200, 30, 30, 255], [30, 160, 60, 255], [30, 60, 200, 255], [240, 220, 40, 255]][(x * 4 / w | 0) % 2 + 2 * ((y * 4 / h | 0) % 2)],
  // 8 pixel checkerboard
  () => (x, y) => ((x >> 3) + (y >> 3)) & 1 ? [250, 250, 250, 255] : [20, 20, 20, 255],
  // concentric rings
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2, d = Math.sqrt(dx * dx + dy * dy); return [(d * 6) & 255, (d * 3) & 255, 128 + (d & 63), 255] },
  // photographic stand-in: smooth waves plus fine noise
  (w, h, r) => (x, y) => { const n = () => (r() * 24) | 0; return [128 + 100 * Math.sin(x / 17 + y / 41) + n(), 128 + 100 * Math.sin(x / 29 - y / 23) + n(), 128 + 100 * Math.cos(y / 19) + n(), 255] },
  // full-range noise (incompressible), small only
  (w, h, r) => () => [r() * 256, r() * 256, r() * 256, 255],
  // alpha ramp over a stripe pattern
  (w, h) => (x, y) => [(x >> 2) % 2 ? 255 : 0, (y >> 2) % 2 ? 255 : 0, 90, (x * 255 / w) | 0],
  // sprite: transparent background with opaque and half-transparent shapes
  (w, h) => (x, y) => { const dx = x - w / 2, dy = y - h / 2; return dx * dx + dy * dy < w * h / 9 ? [220, 120, 20, 255] : Math.abs(dx) < w / 3 && Math.abs(dy) < h / 3 ? [20, 120, 220, 128] : [0, 0, 0, 0] },
  // horizontal bands with noise rows, uneven alpha
  (w, h, r) => (x, y) => y % 16 < 12 ? [60 + (y >> 4) * 9 & 255, 90, 160, 255 - (y & 63)] : [r() * 256, r() * 256, 40, r() * 256],
  // pixel art: 12 colours in 6 by 6 cells, half-transparent where the cell index says so
  (w, h, r) => { const colours = Array.from({ length: 12 }, () => [r() * 256 | 0, r() * 256 | 0, r() * 256 | 0, r() < 0.3 ? 128 : 255]); return (x, y) => colours[((x / 6 | 0) * 7 + (y / 6 | 0) * 3 + ((x / 6 | 0) * (y / 6 | 0) >> 2)) % 12] },
  // waves posterized to steps of 24 in red and green (about 120 colours), opaque
  () => (x, y) => [(128 + 120 * Math.sin(x / 23 + y / 37)) / 24 | 0, (128 + 120 * Math.cos(y / 19 - x / 41)) / 24 | 0, 0, 255].map((v, k) => k === 3 ? 255 : k === 2 ? 96 : v * 24),
]
const sizes = [[64, 64], [128, 96], [200, 150], [256, 256], [320, 240], [400, 300], [160, 160], [96, 128], [512, 128], [100, 300], [131, 77]]
const render = (i, painter, w, h) => {
  const r = rng(91 + i), paint = painters[painter](w, h, r), px = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = paint(x, y); for (let k = 0; k < 4; k++) px[(y * w + x) * 4 + k] = p[k] }
  return px
}
// Eight ways to code the pixels, in turn: from no transform, cache or backward reference at all to every
// transform with a colour cache, LZ77 and several prefix-code groups (as libwebp's encoder writes them).
const configs = [
  {},
  { sg: true, lz77: true },
  { pred: 'best', predBits: 4, lz77: true, cache: 10 },
  { sg: true, pred: 'best', predBits: 5, cc: true, ccBits: 5, lz77: true, cache: 8 },
  { sg: true, pred: 'cycle', predBits: 3, metaBits: 4, groups: 3, lz77: true, cache: 6, maxSymbol: true },
  { pred: 'best', predBits: 2, cc: true, ccBits: 3, metaBits: 5, groups: 4, lz77: true, maxSymbol: true },
  { sg: true, cc: true, ccBits: 4, metaBits: 2, groups: 2, lz77: true, cache: 11 },
  { sg: true, pred: 'cycle', predBits: 2, cc: true, ccBits: 6, lz77: true, cache: 1, maxSymbol: true },
]
const fixtures = []
const add = (i, painter, w, h, cfg) => {
  const data = render(i, painter, w, h)
  let opaque = true
  for (let p = 3; p < data.length; p += 4) if (data[p] !== 255) { opaque = false; break }
  const { file, undone } = encodeWebp(data, w, h, opaque, cfg)
  fixtures.push({ width: w, height: h, opaque, data, file, undone, cfg })
}
for (let i = 0; i < 36; i++) {
  let [w, h] = sizes[(i * 7 + (i >> 3)) % sizes.length]
  if (i % 9 === 5) { w = Math.min(w, 128); h = Math.min(h, 96) }
  add(i, i % 9, w, h, configs[i % configs.length])
}
// Colour-indexed files: 2, 4, 3, 12 and about 120 colours (indices bundled 8, 4, 4 and 2 to a pixel, then
// one byte each), alone, with LZ77 and a cache, and the 120-colour picture with the predictor after the palette.
for (const [k, painter, w, h, cfg] of [
  [36, 2, 131, 77, { palette: true }],
  [37, 2, 256, 256, { palette: true, lz77: true, cache: 4 }],
  [38, 1, 200, 150, { palette: true, lz77: true }],
  [39, 7, 160, 160, { palette: true, lz77: true, cache: 5, maxSymbol: true }],
  [40, 9, 128, 96, { palette: true }],
  [41, 9, 199, 101, { palette: true, lz77: true, metaBits: 3, groups: 2 }],
  [42, 10, 320, 240, { palette: true, lz77: true, cache: 7 }],
  [43, 10, 200, 150, { palette: true, pred: 'best', predBits: 4, lz77: true }],
]) add(k, painter, w, h, cfg)
// Smallest images: one pixel and 17 by 9, opaque and not, plain and with every transform.
add(44, 0, 1, 1, {})
add(45, 7, 1, 1, configs[3])
add(46, 4, 17, 9, configs[7])
add(47, 8, 17, 9, configs[5])
// An input is the WebP file as a lowercase hex string; each adapter turns it into bytes in its untimed prepare step.
export const cases = fixtures.map(({ file }) => ({ input: file.toString('hex') }))

const bytesOf = (data) => typeof data === 'string' ? Buffer.from(data, 'base64') : Buffer.from(data.buffer, data.byteOffset, data.byteLength)
// An output is { width, height, data }: data holds the pixels row by row, as a byte array or a base64 string
// (Go marshals []byte as base64; the Rust, Python and Go runners encode outside timing). A file with
// transparency must give width * height * 4 bytes of RGBA; an opaque one RGB (3 bytes) or RGBA with alpha 255.
export const verifyOne = (i, out) => {
  const { width, height, opaque, data } = fixtures[i]
  assert.ok(out && typeof out === 'object', `fixture ${i}: object output required`)
  assert.equal(out.width, width, `fixture ${i}: width`)
  assert.equal(out.height, height, `fixture ${i}: height`)
  const got = bytesOf(out.data), n = width * height, channels = got.length / n
  assert.ok(channels === 4 || (opaque && channels === 3), `fixture ${i}: ${got.length} bytes is not ${opaque ? 'RGB or RGBA' : 'RGBA'} for ${width} by ${height}`)
  if (channels === 4) { assert.ok(got.equals(data), `fixture ${i}: pixels differ from the generator's`); return }
  for (let p = 0; p < n; p++) for (let k = 0; k < 3; k++) assert.equal(got[p * 3 + k], data[p * 4 + k], `fixture ${i}: pixel ${p} differs from the generator's`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length

// Proof that the check refuses decoders that did not do the job: red and blue swapped (BGRA, OpenCV's
// order), the rows upside down, a buffer never filled, the alpha channel dropped, colours premultiplied
// by alpha, the green not added back to red and blue, and no transform undone at all.
const rgbaOf = (argb) => { const out = Buffer.alloc(argb.length * 4); argb.forEach((p, k) => { out[k * 4] = ch(p, 16); out[k * 4 + 1] = ch(p, 8); out[k * 4 + 2] = ch(p, 0); out[k * 4 + 3] = ch(p, 24) }); return out }
const wrongOutputs = (i) => {
  const { width: w, height: h, data, undone } = fixtures[i], n = w * h
  const map = (f) => { const out = Buffer.from(data); for (let p = 0; p < n; p++) f(out, p * 4); return out }
  const flipped = Buffer.alloc(data.length), stride = w * 4
  for (let y = 0; y < h; y++) data.copy(flipped, (h - 1 - y) * stride, y * stride, (y + 1) * stride)
  const rgb = Buffer.alloc(n * 3)
  for (let p = 0; p < n; p++) data.copy(rgb, p * 3, p * 4, p * 4 + 3)
  const wrong = {
    'red and blue swapped': map((o, q) => { o[q] = data[q + 2]; o[q + 2] = data[q] }),
    'rows upside down': flipped,
    'never filled': Buffer.alloc(data.length),
    'alpha premultiplied': map((o, q) => { for (let k = 0; k < 3; k++) o[q + k] = Math.round(data[q + k] * data[q + 3] / 255) }),
  }
  if (!fixtures[i].opaque) wrong['alpha dropped'] = rgb
  if (undone.sg) wrong['green not added back'] = rgbaOf(undone.sg)
  if (undone.all) wrong['transforms not undone'] = rgbaOf(undone.all)
  return Object.fromEntries(Object.entries(wrong).filter(([, out]) => !out.equals(data)))
}
const refused = new Set()
for (const i of [3, 4, 7, 8, 15]) {
  const { width, height, opaque, data } = fixtures[i]
  verifyOne(i, { width, height, data })
  if (opaque) { const rgb = Buffer.alloc(width * height * 3); for (let p = 0; p < width * height; p++) data.copy(rgb, p * 3, p * 4, p * 4 + 3); verifyOne(i, { width, height, data: rgb }) }
  for (const [what, out] of Object.entries(wrongOutputs(i))) {
    assert.throws(() => verifyOne(i, { width, height, data: out }), undefined, `the check must refuse a decoder that gives ${what} (fixture ${i})`)
    refused.add(what)
  }
}
assert.equal(refused.size, 7, `every mistake must be shown refused on some fixture; shown: ${[...refused].join(', ')}`)
