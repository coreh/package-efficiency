import { strict as assert } from 'node:assert'

// Each input is a JavaScript (ES5) program. The value of its last expression
// statement is the result. The expected values come from host functions below,
// written without any interpreter library.
const fibScript = 'function fib(n){return n<2?n:fib(n-1)+fib(n-2)}fib(22)'
const sortScript =
  'var a=[],x=12345;for(var i=0;i<500;i++){x=(x*48271)%2147483647;a.push(x)}' +
  'a.sort(function(p,q){return p-q});var s=0;' +
  'for(var j=0;j<a.length;j++)s=(s+(j+1)*a[j])%1000003;' +
  'a[0]+","+a[250]+","+a[499]+","+s'
const stringScript =
  'var parts=[];for(var i=0;i<400;i++){parts.push("item"+i+":"+(i*i%97))}parts.join(";")'
const harmonicScript = '(function(){var t=0;for(var i=1;i<=1000;i++)t+=1/i;return t})()'
// Leaves marks on the global object and on a built-in prototype. In a fresh
// context the answer is always 11; in a reused one it grows.
const freshScript =
  'var hits;hits=(typeof hits==="undefined")?1:hits+1;' +
  'Array.prototype.marker=(Array.prototype.marker||0)+1;hits+Array.prototype.marker*10'

const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2))
const expectedSort = () => {
  const a = []
  let x = 12345
  for (let i = 0; i < 500; i++) { x = (x * 48271) % 2147483647; a.push(x) }
  a.sort((p, q) => p - q)
  let s = 0
  for (let j = 0; j < a.length; j++) s = (s + (j + 1) * a[j]) % 1000003
  return `${a[0]},${a[250]},${a[499]},${s}`
}
const expectedString = () => {
  const parts = []
  for (let i = 0; i < 400; i++) parts.push(`item${i}:${(i * i) % 97}`)
  return parts.join(';')
}
const expectedHarmonic = () => { let t = 0; for (let i = 1; i <= 1000; i++) t += 1 / i; return t }

// The fresh-context script appears twice in a row: a reused context answers 21 the second time.
export const cases = [
  { input: fibScript, expected: fib(22) },
  { input: sortScript, expected: expectedSort() },
  { input: stringScript, expected: expectedString() },
  { input: harmonicScript, expected: expectedHarmonic() },
  { input: freshScript, expected: 11 },
  { input: freshScript, expected: 11 },
]

// The reference values must not be trivial.
assert.equal(cases[0].expected, 17711)
assert.ok(cases[1].expected.split(',').length === 4 && cases[1].expected.length > 15)
assert.ok(cases[2].expected.length > 3000)

export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  assert.equal(typeof output, typeof expected, `fixture ${i}: expected a ${typeof expected}, got ${typeof output}`)
  assert.equal(output, expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (typeof value === 'string' ? value.length : 1)
