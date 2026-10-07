import { strict as assert } from 'node:assert'

const value = (i, seed) => (i * 2654435761 + seed) % 4294967296
const model = ({ first, extra, seed }) => {
  const kept = []
  for (let i = 1; i < first; i += 2) kept.push(i)
  const ids = [...kept]
  for (let j = 0; j < extra; j++) ids.push(first + j)
  let sum = 0, mix = 0
  for (const i of ids) {
    const v = value(i, seed)
    sum += v
    mix = (Math.imul(mix, 31) + v) >>> 0
  }
  return { live: ids.length, sum, mix }
}
const firsts = [200, 500, 1000, 2000, 4000, 8000, 12000, 16000, 20000, 24000, 333, 777]
export const cases = Array.from({ length: 36 }, (_, i) => {
  const first = firsts[i % firsts.length] + (i >= 12 ? i * 7 : 0)
  const extra = [Math.floor(first / 2), 0, first, 17, Math.floor(first / 4), 3 * 11][i % 6]
  const input = { first, extra, seed: (i * 7919 + 13) * 104729 % 4294967296 }
  return { input, expected: model(input) }
})
export const verifyResults = (outputs) => {
  assert.equal(outputs.length, cases.length)
  cases.forEach(({ expected }, i) => assert.deepEqual(outputs[i], expected, `fixture ${i}`))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (result) => result.live
