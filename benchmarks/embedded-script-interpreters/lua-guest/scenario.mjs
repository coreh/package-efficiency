import { strict as assert } from 'node:assert'

// Each input is a Lua chunk that ends with `return <value>`. The value it
// returns is the result. The chunks use only the core language plus the `math`
// table, inside what Lua 5.1, 5.3, 5.4, LuaJIT and piccolo all read the same
// way: no table.sort, table.concat or string library (piccolo has none of
// them), no `/` in anything turned into text, every integer below 2^31
// (fengari's integers are 32 bits). The expected values come from host
// functions below, written without any interpreter library.
const fibScript = 'local function fib(n) if n < 2 then return n end return fib(n-1) + fib(n-2) end\nreturn fib(22)'

// 2,000 numbers from a small linear congruential generator, sorted by a heap
// sort written in Lua, reported as "first,middle,last,weighted checksum".
const sortScript = `local a, x, n = {}, 12345, 2000
for i = 1, n do x = (x * 75 + 74) % 65537; a[i] = x end
local function sift(lo, hi)
  local root = lo
  while true do
    local child = root * 2
    if child > hi then return end
    if child < hi and a[child] < a[child + 1] then child = child + 1 end
    if a[root] < a[child] then
      a[root], a[child] = a[child], a[root]
      root = child
    else
      return
    end
  end
end
local start = 1000
while start >= 1 do sift(start, n); start = start - 1 end
local last = n
while last > 1 do
  a[1], a[last] = a[last], a[1]
  last = last - 1
  sift(1, last)
end
local s = 0
for j = 1, n do s = (s + j * a[j]) % 1000003 end
return a[1] .. "," .. a[1001] .. "," .. a[n] .. "," .. s`

const stringScript = `local s = ""
for i = 0, 399 do
  if i > 0 then s = s .. ";" end
  s = s .. "item" .. i .. ":" .. (i * i % 97)
end
return s`

const harmonicScript = 'local t = 0\nfor i = 1, 1000 do t = t + 1 / i end\nreturn t'

// Leaves marks on a global variable and on the built-in math table. In a
// fresh state the answer is always 11; in a reused one it grows.
const freshScript = 'hits = (hits or 0) + 1\nmath.marker = (math.marker or 0) + 1\nreturn hits + math.marker * 10'

const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2))
// Lua 5.1 and gopher-lua have only floats and compute a % b as
// a - floor(a / b) * b. The reference asserts at every step that this gives
// the same as the integer remainder, so every Lua version agrees.
const mod = (a, b) => {
  const r = a % b
  assert.equal(a - Math.floor(a / b) * b, r, `float modulo of ${a} by ${b}`)
  assert.ok(a < 2 ** 31, `${a} must stay inside 32-bit integers`)
  return r
}
const expectedSort = () => {
  const a = []
  let x = 12345
  for (let i = 0; i < 2000; i++) { x = mod(x * 75 + 74, 65537); a.push(x) }
  a.sort((p, q) => p - q)
  let s = 0
  for (let j = 0; j < a.length; j++) s = mod(s + (j + 1) * a[j], 1000003)
  return `${a[0]},${a[1000]},${a[1999]},${s}`
}
const expectedString = () => {
  const parts = []
  for (let i = 0; i < 400; i++) parts.push(`item${i}:${mod(i * i, 97)}`)
  return parts.join(';')
}
const expectedHarmonic = () => { let t = 0; for (let i = 1; i <= 1000; i++) t += 1 / i; return t }

// The fresh-state script appears twice in a row: a reused state answers 21 the second time.
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
assert.ok(!Number.isInteger(cases[3].expected))

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

// Wrong outputs are refused: the scripts themselves, a constant, the first
// fixture's answer everywhere, a reused state (11 then 21), the sum rounded,
// and the input numbers in generated order instead of sorted.
const unsorted = (() => {
  let x = 12345
  const a = []
  for (let i = 0; i < 2000; i++) { x = (x * 75 + 74) % 65537; a.push(x) }
  let s = 0
  for (let j = 0; j < a.length; j++) s = (s + (j + 1) * a[j]) % 1000003
  return `${a[0]},${a[1000]},${a[1999]},${s}`
})()
const good = cases.map(({ expected }) => expected)
assert.doesNotThrow(() => verifyResults(good))
assert.throws(() => verifyResults(cases.map(({ input }) => input)))
assert.throws(() => verifyResults(cases.map(() => 11)))
assert.throws(() => verifyResults(cases.map(() => good[0])))
assert.throws(() => verifyResults([...good.slice(0, 5), 21]))
assert.throws(() => verifyResults([good[0], good[1], good[2], Math.fround(good[3]), 11, 11]))
assert.throws(() => verifyResults([good[0], unsorted, ...good.slice(2)]))
assert.throws(() => verifyResults([String(good[0]), ...good.slice(1)]))

export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (typeof value === 'string' ? value.length : 1)
