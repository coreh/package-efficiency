import { strict as assert } from 'node:assert'

// Deterministic generator (no randomness).
let seed = 0x1badf00d
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const rand = (bits) => { let v = 0n; for (let i = 0; i < bits; i += 32) v = (v << 32n) | BigInt(next()); return v & ((1n << BigInt(bits)) - 1n) }

const v4 = (n) => [24n, 16n, 8n, 0n].map((s) => (n >> s) & 255n).join('.')
const groups = (n) => Array.from({ length: 8 }, (_, i) => Number((n >> BigInt(112 - 16 * i)) & 0xffffn))
// Longest run of zero groups: [start, length].
const longestZeroRun = (g) => {
  let best = [-1, 0], runs = []
  for (let i = 0; i < 8;) { if (g[i] !== 0) { i++; continue } let j = i; while (j < 8 && g[j] === 0) j++; runs.push(j - i); if (j - i > best[1]) best = [i, j - i]; i = j }
  return { best, runs }
}
// RFC 5952 text; null when implementations legitimately differ (a lone zero group, or tied longest runs).
const canonical6 = (n) => {
  const g = groups(n), { best, runs } = longestZeroRun(g)
  if (runs.includes(1)) return null
  if (runs.filter((r) => r === best[1]).length > 1) return null
  const h = g.map((x) => x.toString(16))
  if (best[1] < 2) return h.join(':')
  return `${h.slice(0, best[0]).join(':')}::${h.slice(best[0] + best[1]).join(':')}`
}
const full = (n, upper) => groups(n).map((g) => (upper ? g.toString(16).toUpperCase() : g.toString(16)).padStart(4, '0')).join(':')
// Input spelling: not canonical (upper case, leading zeros, uncompressed or hand-compressed).
const spell6 = (n, i) => {
  const g = groups(n)
  switch (i % 4) {
    case 0: return full(n, true)
    case 1: return full(n, false)
    case 2: return g.map((x) => x.toString(16).toUpperCase()).join(':')
    default: { // compress the first run of zeros by hand, keep upper case
      const { best } = longestZeroRun(g)
      const h = g.map((x) => x.toString(16).toUpperCase())
      return best[1] < 2 ? h.join(':') : `${h.slice(0, best[0]).join(':')}::${h.slice(best[0] + best[1]).join(':')}`
    }
  }
}

const p4 = [8, 8, 9, 10, 12, 13, 14, 15, 16, 16, 16, 17, 18, 19, 20, 21, 22, 22, 23, 24, 24, 24, 24, 25, 26, 27, 28, 29, 30, 31, 32, 11, 5, 7, 0, 1, 3, 4, 6, 24, 16, 20, 12, 18]
const p6 = [16, 20, 28, 29, 32, 32, 32, 36, 40, 44, 48, 48, 48, 52, 56, 56, 60, 62, 63, 64, 64, 64, 64, 65, 68, 72, 80, 88, 96, 104, 112, 120, 126, 127, 128, 10, 8, 4, 0, 33, 40, 48, 64, 56]

export const cases = []
for (let k = 0; k < p4.length; k++) {
  const p = BigInt(p4[k]), hostMask = (1n << (32n - p)) - 1n
  const addr = rand(32)
  const net = addr & ~hostMask & 0xffffffffn
  cases.push({ input: `${v4(addr)}/${p}`, expected: v4(net) })
}
for (let k = 0, made = 0; made < p6.length; k++) {
  const p = BigInt(p6[made]), hostMask = (1n << (128n - p)) - 1n
  const base = rand(128)
  // Every third network gets sparse (zeroed) groups so compression matters.
  let addr = base
  if (k % 3 === 0) for (let gi = 0; gi < 8; gi++) if ((next() >>> 16) % 3 === 0) addr &= ~(0xffffn << BigInt(112 - 16 * gi))
  const net = addr & ~hostMask & ((1n << 128n) - 1n)
  const expected = canonical6(net)
  if (expected === null) continue
  cases.push({ input: `${spell6(addr, made)}/${p}`, expected })
  made++
}
// Interleave families.
{
  const a = cases.slice(0, p4.length), b = cases.slice(p4.length)
  cases.length = 0
  for (let i = 0; i < a.length; i++) cases.push(a[i], b[i])
}

assert.equal(cases.length, p4.length + p6.length)
assert.ok(cases.filter((c) => c.expected.includes('::')).length >= 8, 'enough compressed IPv6 results')
assert.ok(cases.filter((c) => c.input.split('/')[0] !== c.expected && c.expected.includes('.')).length >= 20, 'host bits are set in IPv4 inputs')
assert.ok(cases.every((c) => c.input !== c.expected))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
