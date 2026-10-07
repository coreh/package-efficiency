import { strict as assert } from 'node:assert'
const cases = []
const add = (input) => cases.push({ input })
// primaries, secondaries, black, white
for (const c of [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [0, 255, 255], [255, 0, 255], [0, 0, 0], [255, 255, 255]]) add(c)
// grays and near-grays
for (let i = 0; i < 8; i++) { const g = (i * 37 + 11) % 256; add([g, g, g]) }
for (let i = 0; i < 6; i++) { const g = 40 + i * 35; add([g + 1, g, g - 1 < 0 ? 0 : g - 1]) }
// deterministic spread
const channel = (i, j) => (i * 53 + j * 97 + (i * j) % 31 * 7) % 256
for (let i = 0; i < 28; i++) add([channel(i, 1), channel(i, 2), channel(i, 3)])
// pastel and dark
for (let i = 0; i < 5; i++) add([200 + (i * 11) % 56, 190 + (i * 17) % 66, 210 + (i * 7) % 46])
for (let i = 0; i < 5; i++) add([(i * 9) % 40, (i * 13 + 5) % 40, (i * 5 + 20) % 40])
export { cases }
const reference = ([r, g, b]) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2
  if (d === 0) return { h: null, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  h *= 60; if (h < 0) h += 360
  return { h, s: s * 100, l: l * 100 }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input }] of cases.entries()) {
    const out = outputs[i], ref = reference(input)
    assert.ok(Array.isArray(out) && out.length >= 3, `fixture ${i}: [h, s, l] array required`)
    const [h, s, l] = out
    assert.ok(typeof l === 'number' && Number.isFinite(l), `fixture ${i}: finite lightness required`)
    // d3-color returns NaN saturation for black and white (0/0): undefined, like hue for grays
    if (ref.h !== null && !(ref.l === 0 || ref.l === 100)) assert.ok(typeof s === 'number' && Number.isFinite(s), `fixture ${i}: finite saturation required`)
    else assert.ok(typeof s === 'number' && (Number.isNaN(s) || Math.abs(s) <= 1), `fixture ${i}: saturation 0 or NaN required`)
    if (Number.isFinite(s)) assert.ok(Math.abs(s - ref.s) <= 1, `fixture ${i} (${input}): saturation ${s}, expected ${ref.s}`)
    assert.ok(Math.abs(l - ref.l) <= 1, `fixture ${i} (${input}): lightness ${l}, expected ${ref.l}`)
    if (ref.h !== null) {
      assert.ok(typeof h === 'number' && Number.isFinite(h), `fixture ${i}: finite hue required`)
      const diff = Math.abs(h - ref.h) % 360
      assert.ok(Math.min(diff, 360 - diff) <= 1, `fixture ${i} (${input}): hue ${h}, expected ${ref.h}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
// Reads a computed number, not the array's length (always 3), so the conversion cannot be optimised away.
// Lightness is finite for every fixture.
export const consume = (value) => value[2]
