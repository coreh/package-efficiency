import { strict as assert } from 'node:assert'

// Reference natural comparator: digit runs by value, other characters by code.
const isDigit = (c) => c >= '0' && c <= '9'
const reference = (a, b) => {
  let i = 0, j = 0
  while (i < a.length && j < b.length) {
    if (isDigit(a[i]) && isDigit(b[j])) {
      let ie = i, je = j
      while (ie < a.length && isDigit(a[ie])) ie++
      while (je < b.length && isDigit(b[je])) je++
      const x = a.slice(i, ie), y = b.slice(j, je)
      if (x.length !== y.length) return x.length - y.length
      if (x !== y) return x < y ? -1 : 1
      i = ie; j = je
    } else {
      if (a[i] !== b[j]) return a.charCodeAt(i) - b.charCodeAt(j)
      i++; j++
    }
  }
  return (a.length - i) - (b.length - j)
}

let seed = 20261007
const rand = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor((seed / 4294967296) * n) }
const stems = ['file', 'img-', 'chapter', 'a', 'report-', 'v', 'track-', 'item-', 'x', 'build-']
const tails = ['', 'txt', '-final', 'b', '-v2', '-a1', '-tar-gz', 'z']

const makeList = (index) => {
  const size = 20 + (index * 7) % 101
  const stem = stems[index % stems.length]
  const wide = index % 3 === 0
  const seen = new Set()
  const list = []
  while (list.length < size) {
    const n = 1 + rand(wide ? 5000 : 40)
    let s = stem + n
    if (index % 2 === 1) s += (index % 4 === 1 ? 'x' : '-') + (1 + rand(120))
    if (index % 5 === 0) s = stems[rand(stems.length)] + n
    s += tails[rand(tails.length)]
    if (!seen.has(s)) { seen.add(s); list.push(s) }
  }
  return list
}

export const cases = Array.from({ length: 48 }, (_, i) => {
  const input = makeList(i)
  return { input, expected: input.slice().sort(reference) }
})

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.ok(Array.isArray(outputs[i]), `fixture ${i}: array output required`)
    assert.deepEqual(outputs[i], expected, `fixture ${i}`)
    assert.equal(outputs[i].length, input.length, `fixture ${i}: length`)
  }
}
export const verify = (operation) => {
  const inputs = cases.map(({ input }) => input.slice())
  verifyResults(inputs.map((input) => operation(input)))
  inputs.forEach((input, i) => assert.deepEqual(input, cases[i].input, `fixture ${i}: input was modified`))
}
export const consume = (value) => value.length
