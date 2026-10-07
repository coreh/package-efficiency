import { strict as assert } from 'node:assert'
// An input is { command, args }: an absolute path (no PATH lookup, no shell)
// and its arguments. /bin/echo is the same small program on macOS and Linux;
// it prints its arguments joined by spaces, then a newline, and exits with 0.
const words = ['alpha', 'two words', 'ünï côdé', '--flag=1', '$HOME', '*', 'a"b', "it's", '', 'x'.repeat(200), '日本語', '-n?', 'tab\there', 'back\\slash', '#x', '1 2  3']
const counts = [1, 2, 3, 5, 8, 12, 20, 40]
export const cases = counts.map((count, i) => {
  // The first argument is never one that echo would read as an option.
  const args = [`run-${i}`, ...Array.from({ length: count - 1 }, (_, k) => words[(i * 5 + k * 3) % words.length])]
  return { input: { command: '/bin/echo', args }, expected: { stdout: args.join(' ') + '\n', status: 0 } }
})
// A result is { stdout, status }. Libraries differ on whether the final
// newline of the output is kept; both are accepted. Everything else is exact.
export const verifyOne = (i, output) => {
  const { expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(output && typeof output === 'object', `fixture ${i}: a result object is required`)
  assert.equal(output.status, expected.status, `fixture ${i}: exit status`)
  assert.equal(typeof output.stdout, 'string', `fixture ${i}: the output must be text`)
  assert.ok(output.stdout === expected.stdout || output.stdout + '\n' === expected.stdout, `fixture ${i}: the child's output was ${JSON.stringify(output.stdout.slice(0, 80))}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.stdout.length
