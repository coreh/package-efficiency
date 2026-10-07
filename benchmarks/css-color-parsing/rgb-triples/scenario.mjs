import { strict as assert } from 'node:assert'
const hex2 = (n) => n.toString(16).padStart(2, '0')
const hslToRgb = (h, s, l) => {
  s /= 100; l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255))
}
const channel = (i, j) => (i * 53 + j * 97 + (i * j) % 31 * 7) % 256
const rgb = (i) => [channel(i, 1), channel(i, 2), channel(i, 3)]
const cases = []
const add = (input, expected) => cases.push({ input, expected })
// #rrggbb, lower and upper case
for (let i = 0; i < 18; i++) {
  const c = rgb(i)
  const s = '#' + c.map(hex2).join('')
  add(i % 2 ? s.toUpperCase() : s, c)
}
// #rgb: each digit doubled
for (let i = 0; i < 10; i++) {
  const d = [(i * 5 + 1) % 16, (i * 7 + 3) % 16, (i * 11 + 2) % 16]
  add('#' + d.map((n) => n.toString(16)).join(''), d.map((n) => n * 17))
}
// rgb() with integers
for (let i = 0; i < 16; i++) {
  const c = rgb(i + 40)
  add(`rgb(${c.join(', ')})`, c)
}
// rgb() with whole-number percentages that map to whole channels
for (let i = 0; i < 6; i++) {
  const p = [0, 20, 40, 60, 80, 100]
  const q = [p[i], p[(i + 2) % 6], p[(i + 4) % 6]]
  add(`rgb(${q.map((n) => n + '%').join(', ')})`, q.map((n) => Math.round(n * 2.55)))
}
// hsl()
for (let i = 0; i < 20; i++) {
  const h = (i * 47) % 360, s = [100, 75, 50, 30, 0][i % 5], l = [50, 25, 70, 90, 10][(i * 3) % 5]
  add(`hsl(${h}, ${s}%, ${l}%)`, hslToRgb(h, s, l))
}
// extremes
add('#000000', [0, 0, 0]); add('#ffffff', [255, 255, 255])
add('hsl(0, 0%, 0%)', [0, 0, 0]); add('hsl(0, 0%, 100%)', [255, 255, 255])
export { cases }
const toTriple = (out, i) => {
  let t, alpha
  if (Array.isArray(out) || ArrayBuffer.isView(out)) { t = [out[0], out[1], out[2]]; alpha = out[3] }
  else {
    assert.ok(out !== null && typeof out === 'object', `fixture ${i}: array or object required`)
    t = [out.r, out.g, out.b]; alpha = out.opacity ?? out.a
  }
  for (const v of t) assert.ok(typeof v === 'number' && Number.isFinite(v), `fixture ${i}: numeric channels required`)
  assert.ok(alpha === undefined || alpha === 1, `fixture ${i}: color must be opaque`)
  return t.map(Math.round)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    const got = toTriple(outputs[i], i)
    for (let k = 0; k < 3; k++) assert.ok(Math.abs(got[k] - expected[k]) <= 1, `fixture ${i} (${input}): got ${got}, expected ${expected}`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Array.isArray(value) ? value.length : 1
