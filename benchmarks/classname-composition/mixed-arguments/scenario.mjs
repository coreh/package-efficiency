import { strict as assert } from 'node:assert'

const base = ['btn', 'card', 'nav-item', 'input', 'modal', 'badge', 'list-row', 'tab']
const sizes = ['text-sm', 'text-base', 'text-lg', 'p-2', 'px-4 py-2', 'w-full']
const states = ['is-active', 'is-disabled', 'has-error', 'is-loading', 'hover:bg-blue-500', 'focus-visible:ring-2', 'dark:bg-slate-900']
const layout = ['flex', 'grid grid-cols-3', 'items-center', 'justify-between', 'gap-4', 'hidden', 'md:flex']

const pick = (list, n) => list[n % list.length]

// Reference semantics: strings as-is when non-empty, arrays flattened depth
// first, objects contribute keys with truthy values, falsy values skipped.
const flatten = (arg, out) => {
  if (!arg) return
  if (typeof arg === 'string') out.push(arg)
  else if (Array.isArray(arg)) for (const a of arg) flatten(a, out)
  else if (typeof arg === 'object') for (const k of Object.keys(arg)) if (arg[k]) out.push(k)
}
const reference = (args) => {
  const out = []
  flatten(args, out)
  return out.join(' ')
}

const build = (i) => {
  const flag = (n) => ((i * 7 + n * 3) % 5) < 2
  const args = [
    pick(base, i),
    flag(0) ? pick(sizes, i + 1) : null,
    { [pick(states, i)]: flag(1), [pick(states, i + 2)]: !flag(2), [pick(layout, i)]: flag(3), 'is-open': i % 3 === 0 },
    flag(4) ? undefined : [pick(layout, i + 3), [pick(sizes, i + 4), flag(5) && pick(states, i + 5)]],
    '',
    flag(6) && 'rounded',
    [[pick(base, i + 3), { 'is-selected': flag(7), 'is-first': i % 4 === 0 }], null, [[pick(states, i + 1)]]],
    i % 6 === 0 ? false : `${pick(layout, i + 5)} ${pick(sizes, i + 2)}`,
    { primary: i % 2 === 0, secondary: i % 2 === 1, outline: flag(8), 'w-1/2': false },
    i % 5 === 0 ? ['custom-' + i, 'extra', ['deep-' + (i % 7)]] : 'user-class-' + (i % 9),
  ]
  return args
}

export const cases = Array.from({ length: 48 }, (_, i) => {
  const input = build(i)
  return { input, expected: reference(input) }
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
