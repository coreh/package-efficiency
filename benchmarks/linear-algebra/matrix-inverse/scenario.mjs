import { strict as assert } from 'node:assert'
// Diagonally dominant, non-symmetric matrices with entries in multiples of 1/4,
// so every one is invertible and well conditioned. Every third fixture has its
// rows rotated, which puts zeros on the diagonal and needs row pivoting.
const sizes = [3, 4, 4, 5, 6, 8, 10, 12]
const entry = (i, j, s) => (((i * 7 + j * 13 + s * 5 + i * j) % 17) - 8) / 4
const build = (n, s) => {
  const a = Array.from({ length: n * n }, (_, k) => entry(Math.floor(k / n), k % n, s))
  for (let i = 0; i < n; i++) a[i * n + i] = (s % 2 ? 1 : -1) * (2 * n + 1 + (s % 3) / 4)
  if (s % 3 === 0) { const r = []; for (let i = 0; i < n; i++) r.push(...a.slice(((i + 1) % n) * n, ((i + 1) % n) * n + n)); return r }
  return a
}
// Gauss-Jordan with partial pivoting.
const reference = (n, a) => {
  const m = Array.from({ length: n }, (_, i) => [...a.slice(i * n, i * n + n), ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r
    ;[m[c], m[p]] = [m[p], m[c]]
    const d = m[c][c]
    for (let j = 0; j < 2 * n; j++) m[c][j] /= d
    for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c]; for (let j = 0; j < 2 * n; j++) m[r][j] -= f * m[c][j] }
  }
  return m.flatMap((row) => row.slice(n))
}
export const cases = Array.from({ length: 48 }, (_, i) => {
  const n = sizes[i % sizes.length]
  const a = build(n, i)
  return { input: { n, a }, expected: reference(n, a) }
})
// A library's own result type is read through its flat row-major data.
const flat = (r) => Array.isArray(r) ? r : Array.from(r.data ?? r.toArray())
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input: { n, a }, expected }] of cases.entries()) {
    const out = flat(outputs[i])
    assert.equal(out.length, expected.length, `fixture ${i}: length`)
    for (let k = 0; k < expected.length; k++) assert.ok(Math.abs(out[k] - expected[k]) <= 1e-8, `fixture ${i}: element ${k}: ${out[k]} vs ${expected[k]}`)
    // The input times the result must be the identity.
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      let s = 0
      for (let k = 0; k < n; k++) s += a[r * n + k] * out[k * n + c]
      assert.ok(Math.abs(s - (r === c ? 1 : 0)) <= 1e-8, `fixture ${i}: a * result at ${r},${c} is ${s}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.data.length
