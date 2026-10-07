import { strict as assert } from 'node:assert'
// Identifiers are built from lowercase ASCII words so that every package agrees
// on where the word boundaries are.
const words = ['user', 'account', 'name', 'first', 'last', 'created', 'at', 'request', 'handler', 'max', 'retry', 'count', 'background', 'color', 'is', 'enabled', 'http', 'server', 'port', 'file', 'path', 'default', 'value', 'order', 'item', 'total', 'price', 'shipping', 'address', 'line']
const cap = (w) => w[0].toUpperCase() + w.slice(1)
const styles = [
  (ws) => ws.join('_'),
  (ws) => ws.join('-'),
  (ws) => ws.join(' '),
  (ws) => ws.map(cap).join(''),
  (ws) => ws[0] + ws.slice(1).map(cap).join(''),
  (ws) => ws.map((w, i) => (i % 2 ? '-' : '_') + w).join('').slice(1),
]
export const cases = Array.from({ length: 60 }, (_, i) => {
  const count = 2 + (i % 5)
  const ws = Array.from({ length: count }, (_, j) => words[(i * 7 + j * 11 + (i >> 2)) % words.length])
  return { input: styles[i % styles.length](ws), expected: ws[0] + ws.slice(1).map(cap).join('') }
})
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
