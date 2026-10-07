import { strict as assert } from 'node:assert'

// Deterministic generator (no randomness).
let seed = 0x2545f491
const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0)
const rand = (bits) => { let v = 0n; for (let i = 0; i < bits; i += 32) v = (v << 32n) | BigInt(next()); return v & ((1n << BigInt(bits)) - 1n) }

const v4 = (n) => [24n, 16n, 8n, 0n].map((s) => (n >> s) & 255n).join('.')
const v6groups = (n) => Array.from({ length: 8 }, (_, i) => Number((n >> BigInt(112 - 16 * i)) & 0xffffn))
const v6full = (n, upper) => v6groups(n).map((g) => (upper ? g.toString(16).toUpperCase() : g.toString(16)).padStart(4, '0')).join(':')
const v6short = (n) => {
  const g = v6groups(n).map((x) => x.toString(16))
  let best = [-1, 0]
  for (let i = 0; i < 8;) { if (g[i] !== '0') { i++; continue } let j = i; while (j < 8 && g[j] === '0') j++; if (j - i > best[1]) best = [i, j - i]; i = j }
  if (best[1] < 2) return g.join(':')
  const head = g.slice(0, best[0]).join(':'), tail = g.slice(best[0] + best[1]).join(':')
  return `${head}::${tail}`
}

const make = (bits, fmt) => {
  const out = []
  const total = 1n << BigInt(bits)
  const prefixes = bits === 32
    ? [0, 4, 8, 8, 12, 16, 16, 16, 18, 20, 22, 24, 24, 24, 25, 26, 27, 28, 29, 30, 31, 32, 9, 10, 13, 14, 15, 17, 19, 21, 23, 24, 16, 8, 24, 12]
    : [0, 8, 16, 32, 32, 32, 40, 48, 48, 48, 52, 56, 60, 64, 64, 64, 64, 72, 80, 96, 112, 120, 126, 127, 128, 10, 29, 33, 44, 56, 64, 64, 48, 32, 128, 16]
  for (let i = 0; i < 36; i++) {
    const p = BigInt(prefixes[i]), host = BigInt(bits) - p
    const hostMask = (1n << host) - 1n
    const net = rand(bits) & ~hostMask & (total - 1n)
    let addr, inside = true
    switch (i % 6) {
      case 0: case 1: addr = net | (rand(bits) & hostMask); break               // inside, random host
      case 2: addr = i % 12 === 2 ? net : net | hostMask; break                  // inside, first or last
      case 3: addr = (net - 1n) & (total - 1n); inside = p === 0n; break         // just before
      case 4: addr = (net + hostMask + 1n) & (total - 1n); inside = p === 0n; break // just after
      default: addr = p === 0n ? rand(bits) : net ^ (1n << (host + BigInt(i % Math.max(1, Number(p))))); inside = p === 0n // one network bit flipped
    }
    const expected = (addr >> host) === (net >> host)
    assert.equal(expected, inside) // the construction intent and the oracle agree
    out.push({ input: [fmt(addr, i), `${fmt(net, 0, true)}/${p}`], expected })
  }
  return out
}

export const cases = [
  ...make(32, (n) => v4(n)),
  ...make(128, (n, i, canon) => (canon ? v6short(n) : i % 3 === 0 ? v6full(n, i % 2 === 0) : v6short(n))),
]
// Interleave so families alternate.
const v4cases = cases.slice(0, 36), v6cases = cases.slice(36)
cases.length = 0
for (let i = 0; i < 36; i++) cases.push(v4cases[i], v6cases[i])

assert.equal(cases.length, 72)
assert.ok(cases.some((c) => c.expected) && cases.some((c) => !c.expected))

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'boolean', `fixture ${i}: boolean output required`)
    assert.equal(outputs[i], expected, `fixture ${i}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Number(value)
