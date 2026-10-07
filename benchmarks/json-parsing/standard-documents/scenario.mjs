import { strict as assert } from 'node:assert'
const record = (i, j) => ({
  id: i * 100 + j,
  name: `User ${i}-${j} éç 日本語 😀`,
  quote: 'He said "hi"\n\tback\\slash / </script>',
  active: (i + j) % 2 === 0,
  deleted: null,
  score: (i * 7 + j) / 8,
  ratio: -(j + 1) / 4,
  big: 1.5e10 + i,
  tiny: 25e-5,
  tags: ['alpha', 'βeta', 'gamma'.repeat(1 + (j % 3)), null, true],
  nested: { scores: [i, j, i + j, -(i + 1)], address: { city: 'São Paulo', zip: `${10000 + i}`, geo: { lat: Number((-23.55 - j / 100).toFixed(2)), lon: -46.63 } } },
})
export const cases = Array.from({ length: 48 }, (_, i) => {
  const data = Array.from({ length: i + 1 }, (_, j) => record(i, j))
  return { input: JSON.stringify(data), expected: data }
})
const same = (a, b, path) => {
  if (Array.isArray(b)) {
    assert.ok(Array.isArray(a), `${path}: array expected`)
    assert.equal(a.length, b.length, `${path}: length`)
    b.forEach((v, i) => same(a[i], v, `${path}[${i}]`))
  } else if (b !== null && typeof b === 'object') {
    assert.ok(a !== null && typeof a === 'object' && !Array.isArray(a), `${path}: object expected`)
    assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), `${path}: keys`)
    for (const k of Object.keys(b)) same(a[k], b[k], `${path}.${k}`)
  } else {
    assert.equal(typeof a, typeof b, `${path}: type`)
    assert.ok(Object.is(a, b), `${path}: ${a} !== ${b}`)
  }
}
// Native runtimes send their outputs here after a JSON round trip.
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) same(outputs[i], expected, `fixture ${i}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
