import { strict as assert } from 'node:assert'

// Deterministic generator (xorshift32), no Math.random.
let state = 0x2f6b9c1d
const next = () => { state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state }
const below = (n) => next() % n
const bigBelow = (digits) => { let v = 0n; for (let i = 0; i < digits; i++) v = v * 10n + BigInt(below(10)); return v }

// Every value is a BigInt counted in units of 10^-12; products have at most 12 fractional digits.
const SCALE = 12
const LINES = 2000
const BLOCK = 200
const FIXTURES = 6
const CENT = 10n ** 10n // 0.01 in units of 10^-12
const TIE = CENT / 2n
const pow10 = (n) => 10n ** BigInt(n)
const mod = (a, m) => ((a % m) + m) % m

// Writes a scaled integer with exactly `scale` fractional digits, as the fixtures spell them.
const spell = (units, scale) => {
  const negative = units < 0n
  const digits = (negative ? -units : units).toString().padStart(scale + 1, '0')
  const text = scale === 0 ? digits : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`
  return negative ? `-${text}` : text
}

// Half-even rounding of a value in 10^-12 units to whole cents.
const roundHalfEven = (s) => {
  const negative = s < 0n
  const a = negative ? -s : s
  let q = a / CENT
  const r = a % CENT
  if (2n * r > CENT || (2n * r === CENT && q % 2n === 1n)) q += 1n
  return negative ? -q : q
}
const centsText = (cents) => spell(cents, 2)

const makeLine = (refunds) => {
  // Rate: 0 to 4 integer digits and 0 to 6 fractional digits (written with trailing zeros as generated).
  const rateInt = below(5)
  const rateScale = below(7)
  let rate = bigBelow(rateInt + rateScale)
  if (rate === 0n) rate = 1n
  // Amount: mostly two fractional digits, up to six; integer digits so that |amount * rate| < 10^12.
  const amountScale = [2, 2, 2, 2, 0, 1, 3, 4, 6][below(9)]
  const amountInt = below(Math.min(10, 12 - rateInt) + 1)
  let amount = bigBelow(amountInt + amountScale)
  if (amount !== 0n && below(100) < (refunds ? 60 : 10)) amount = -amount
  return { amount: spell(amount, amountScale), rate: spell(rate, rateScale), product: amount * rate * pow10(SCALE - amountScale - rateScale) }
}

// The "fee" line that makes the running value land exactly on half a cent: amount * 0.000001.
const tieLine = (running) => {
  const units = mod(TIE - mod(running, CENT), CENT)
  return { amount: spell(units, 6), rate: '0.000001', product: units }
}

const fixtures = []
for (let f = 0; f < FIXTURES; f++) {
  const refunds = f === 3
  const amounts = [], rates = [], blockSums = []
  let total = 0n
  for (let b = 0; b < LINES / BLOCK; b++) {
    let sum = 0n
    for (let i = 0; i < BLOCK; i++) {
      let line = makeLine(refunds)
      const last = i === BLOCK - 1
      if (last && f % 2 === 1 && b === LINES / BLOCK - 1) line = tieLine(total + sum) // the total is a tie
      else if (last && (b + f) % 3 === 0) line = tieLine(sum) // this block's subtotal is a tie
      amounts.push(line.amount); rates.push(line.rate)
      sum += line.product
      // Every exact value has at most 27 significant digits and 12 fractional ones.
      assert.ok((line.product < 0n ? -line.product : line.product) < pow10(24), 'product below 10^12')
      assert.ok(((total + sum) < 0n ? -(total + sum) : total + sum) < pow10(27), 'running total below 10^15')
    }
    blockSums.push(sum)
    total += sum
  }
  fixtures.push({ input: { amounts, rates, block: BLOCK }, sums: [total, ...blockSums] })
}

export const cases = fixtures.map(({ input, sums }) => ({ input, expected: sums.map((s) => centsText(roundHalfEven(s))) }))

// Reads a plain decimal string into 10^-12 units; anything else is refused.
const read = (text, where) => {
  assert.equal(typeof text, 'string', `${where}: string required`)
  const m = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/.exec(text)
  assert.ok(m, `${where}: ${JSON.stringify(text)} is not a plain decimal`)
  const fraction = (m[3] ?? '').replace(/0+$/, '')
  assert.ok(fraction.length <= SCALE, `${where}: ${text} has more than ${SCALE} significant fractional digits`)
  const units = BigInt(m[2] + fraction.padEnd(SCALE, '0'))
  assert.ok(!(m[1] === '-' && units === 0n), `${where}: negative zero`)
  return m[1] === '-' ? -units : units
}

export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.ok(Array.isArray(output) && output.length === expected.length, `fixture ${i}: ${expected.length} strings required`)
  for (let k = 0; k < expected.length; k++) {
    const where = `fixture ${i}[${k}]`
    assert.equal(read(output[k], where), read(expected[k], where), `${where}: ${output[k]}, expected ${expected[k]}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value[0].length

// --- Self-checks: the fixtures hold the traps, and wrong answers are refused.
const allSums = fixtures.flatMap(({ sums }) => sums)
const ties = allSums.filter((s) => mod(s, CENT) === TIE)
assert.ok(ties.filter((s) => s > 0n && (s / CENT) % 2n === 0n).length >= 3, 'positive ties that round down')
assert.ok(ties.filter((s) => s > 0n && (s / CENT) % 2n === 1n).length >= 3, 'positive ties that round up')
assert.ok(ties.filter((s) => s < 0n).length >= 2, 'negative ties')
assert.ok(allSums.every((s) => roundHalfEven(s) !== 0n), 'no value rounds to zero')
assert.ok(allSums.filter((s) => mod(s, CENT) !== 0n).length === allSums.length, 'every exact value needs rounding')

const wrong = (fn) => fixtures.map(({ sums }) => sums.map(fn))
const pass = (outputs) => verifyResults(outputs)
const fails = (outputs, what) => assert.throws(() => pass(outputs), undefined, `${what} must fail`)
pass(cases.map(({ expected }) => expected.map((t) => t.replace(/\.?0+$/, '')))) // trailing zeros forgiven
pass(cases.map(({ expected }) => expected.map((t) => `${t}0000`)))
const halfAway = (s) => { const a = s < 0n ? -s : s; const q = (a + TIE) / CENT; return s < 0n ? -q : q }
fails(wrong((s) => centsText(halfAway(s))), 'half away from zero')
fails(wrong((s) => centsText(s / CENT)), 'truncation')
fails(wrong((s) => spell(s, SCALE)), 'the unrounded sum')
fails(cases.map(({ input }) => {
  const out = []
  let total = 0, sum = 0
  for (let i = 0; i < input.amounts.length; i++) {
    sum += Number(input.amounts[i]) * Number(input.rates[i])
    if ((i + 1) % BLOCK === 0) { out.push(sum.toFixed(2)); total += sum; sum = 0 }
  }
  return [total.toFixed(2), ...out]
}), 'binary floating point')
// Rounding every product to cents before adding.
fails(cases.map(({ input }) => {
  const out = []
  let total = 0n, sum = 0n
  for (let i = 0; i < input.amounts.length; i++) {
    sum += roundHalfEven(read(input.amounts[i], 'a') * read(input.rates[i], 'r') / pow10(SCALE)) * CENT
    if ((i + 1) % BLOCK === 0) { out.push(centsText(roundHalfEven(sum))); total += sum; sum = 0n }
  }
  return [centsText(roundHalfEven(total)), ...out]
}), 'rounding each line first')
// 20 significant digits (decimal.js's default precision), half-up, after every product and sum.
const sig20 = (s) => {
  const a = s < 0n ? -s : s
  const extra = a.toString().length - 20
  if (extra <= 0) return s
  const d = pow10(extra)
  const q = ((a + d / 2n) / d) * d
  return s < 0n ? -q : q
}
fails(cases.map(({ input }) => {
  const out = []
  let total = 0n, sum = 0n
  for (let i = 0; i < input.amounts.length; i++) {
    sum = sig20(sum + sig20(read(input.amounts[i], 'a') * read(input.rates[i], 'r') / pow10(SCALE)))
    if ((i + 1) % BLOCK === 0) { out.push(centsText(roundHalfEven(sum))); total = sig20(total + sum); sum = 0n }
  }
  return [centsText(roundHalfEven(total)), ...out]
}), '20 significant digits')
fails(cases.map(({ expected }) => expected.map((t) => Number(t).toExponential())), 'exponent notation')
fails(cases.map(({ expected }) => expected.map(Number)), 'numbers instead of strings')
fails(cases.map(({ expected }) => expected.slice(1)), 'subtotals without the total')
fails(cases.map(({ expected }) => [...expected.slice(1), expected[0]]), 'the total last')
fails(cases.map((_, i) => cases[(i + 1) % cases.length].expected), "another fixture's result")
assert.throws(() => read('-0.00', 'x'))
assert.throws(() => read('+1.00', 'x'))
assert.throws(() => read('01.00', 'x'))
assert.throws(() => read('1,000.00', 'x'))
