import { strict as assert } from 'node:assert'
// Each fixture is a chain of 64 4x4 transforms (rotations, scales,
// translations), row-major. The job: multiply them in order,
// m[0] * m[1] * ... * m[63], and invert the product.
// Rotations use Pythagorean triples, so every cosine and sine is a correctly
// rounded quotient and the fixtures are the same on every runtime.
const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [12, 35, 37], [9, 40, 41], [28, 45, 53]]
const scales = [0.8, 1, 1.25]
const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const rotation = (axis, c, s) => {
  const m = identity()
  const [i, j] = axis === 0 ? [1, 2] : axis === 1 ? [2, 0] : [0, 1]
  m[i * 4 + i] = c; m[i * 4 + j] = -s; m[j * 4 + i] = s; m[j * 4 + j] = c
  return m
}
const chain = (seed) => {
  let x = (seed * 2654435761 + 12345) >>> 0 || 1
  const next = (n) => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x % n }
  return Array.from({ length: 64 }, (_, k) => {
    const kind = k % 8 === 7 ? 'scale' : next(3) === 0 ? 'translation' : 'rotation'
    if (kind === 'scale') {
      const m = identity()
      for (let a = 0; a < 3; a++) m[a * 5] = scales[next(3)]
      return m
    }
    if (kind === 'translation') {
      const m = identity()
      for (let a = 0; a < 3; a++) m[a * 4 + 3] = (next(17) - 8) / 4
      return m
    }
    const [p, q, h] = triples[next(triples.length)]
    const swap = next(2), sign = next(2) ? -1 : 1
    return rotation(next(3), (swap ? q : p) / h, sign * (swap ? p : q) / h)
  })
}
const multiply = (a, b) => {
  const c = new Array(16)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0
    for (let k = 0; k < 4; k++) s += a[i * 4 + k] * b[k * 4 + j]
    c[i * 4 + j] = s
  }
  return c
}
// Gauss-Jordan with partial pivoting.
const invert = (a) => {
  const m = Array.from({ length: 4 }, (_, i) => [...a.slice(i * 4, i * 4 + 4), ...identity().slice(i * 4, i * 4 + 4)])
  for (let c = 0; c < 4; c++) {
    let p = c
    for (let r = c + 1; r < 4; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r
    ;[m[c], m[p]] = [m[p], m[c]]
    const d = m[c][c]
    for (let j = 0; j < 8; j++) m[c][j] /= d
    for (let r = 0; r < 4; r++) if (r !== c) { const f = m[r][c]; for (let j = 0; j < 8; j++) m[r][j] -= f * m[c][j] }
  }
  return m.flatMap((row) => row.slice(4))
}
export const cases = Array.from({ length: 16 }, (_, i) => {
  const matrices = chain(i + 1)
  const product = matrices.reduce(multiply)
  return { input: { matrices }, expected: [product, invert(product)] }
})
// Each element must be within 1e-9 of the reference, relative to the largest
// element of that matrix (so a zero element is not held to a relative error
// of its rounding noise). Measured: other summation orders and the cofactor
// inverse differ by under 2e-15; the same work in 32-bit floats by over 1e-7.
export const tolerance = 1e-9
const flat16 = (v, what) => {
  assert.ok(Array.isArray(v) || ArrayBuffer.isView(v), `${what} must be an array`)
  assert.equal(v.length, 16, `${what} must have 16 elements`)
  for (const e of v) assert.ok(typeof e === 'number' && Number.isFinite(e), `${what}: ${e} is not a finite number`)
  return Array.from(v)
}
const close = (out, exp, what) => {
  const scale = Math.max(...exp.map(Math.abs))
  for (let k = 0; k < 16; k++) assert.ok(Math.abs(out[k] - exp[k]) <= tolerance * scale, `${what}: element ${k}: ${out[k]} vs ${exp[k]}`)
}
export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output) && output.length === 2, `fixture ${i}: output must be [product, inverse]`)
  const [expProduct, expInverse] = cases[i].expected
  const product = flat16(output[0], `fixture ${i}: product`)
  const inverse = flat16(output[1], `fixture ${i}: inverse`)
  close(product, expProduct, `fixture ${i}: product`)
  close(inverse, expInverse, `fixture ${i}: inverse`)
  // The product times the inverse must be the identity.
  const id = multiply(product, inverse)
  for (let k = 0; k < 16; k++) assert.ok(Math.abs(id[k] - (k % 5 === 0 ? 1 : 0)) <= tolerance, `fixture ${i}: product * inverse at ${k} is ${id[k]}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check refuses wrong outputs, run at load.
{
  const transpose = (a) => a.map((_, k) => a[(k % 4) * 4 + Math.floor(k / 4)])
  const f32 = (a) => Array.from(new Float32Array(a))
  const refuses = (i, output, why) => assert.throws(() => verifyOne(i, output), undefined, `the check accepts ${why}`)
  // Sanity: other correct methods pass.
  const cofactorInverse = (m) => {
    const det3 = (a, b, c, d, e, f, g, h, k) => a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g)
    const minor = (r, c) => { const e = []; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (i !== r && j !== c) e.push(m[i * 4 + j]); return det3(...e) }
    const cof = Array.from({ length: 16 }, (_, k) => ((Math.floor(k / 4) + k % 4) % 2 ? -1 : 1) * minor(Math.floor(k / 4), k % 4))
    const det = m[0] * cof[0] + m[1] * cof[1] + m[2] * cof[2] + m[3] * cof[3]
    return transpose(cof).map((v) => v / det)
  }
  for (const [i, { input: { matrices } }] of cases.entries()) {
    const reversedAssoc = matrices.reduceRight((acc, m) => multiply(m, acc))
    const pairs = (list) => list.length === 1 ? list[0] : pairs(Array.from({ length: list.length / 2 }, (_, k) => multiply(list[2 * k], list[2 * k + 1])))
    verifyOne(i, [reversedAssoc, cofactorInverse(reversedAssoc)])
    verifyOne(i, [pairs(matrices), invert(pairs(matrices))])
  }
  const i = 3, [p, inv] = cases[i].expected, ms = cases[i].input.matrices
  const backwards = [...ms].reverse().reduce(multiply)
  refuses(i, [backwards, invert(backwards)], 'the chain multiplied in reverse order')
  refuses(i, [transpose(p), transpose(inv)], 'the transposed (column-major) product and inverse')
  refuses(i, [p, transpose(inv)], 'the inverse in column-major order')
  refuses(i, [p, p], 'the product as its own inverse')
  refuses(i, [p, identity()], 'the identity as the inverse')
  refuses(i, [ms[0], invert(ms[0])], 'the first matrix only')
  refuses(i, [ms.slice(0, 63).reduce(multiply), inv], 'a chain missing its last matrix')
  refuses(i, [f32(p), f32(inv)], 'the result rounded to 32-bit floats')
  refuses(i, [cases[i + 1].expected[0], cases[i + 1].expected[1]], "another fixture's result")
  refuses(i, [p], 'the product alone')
  refuses(i, [...p, ...inv], 'one flat array of 32 numbers')
}
