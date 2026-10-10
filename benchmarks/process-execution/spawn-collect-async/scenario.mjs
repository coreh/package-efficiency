import { strict as assert } from 'node:assert'
// The asynchronous form of process-execution/spawn-collect, with the same
// fixtures and the same check, written out again here because a scenario is
// loaded alone beside each adapter. Keep the two in step.
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
const verifyOne = (i, output) => {
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
// Each operation is awaited before the next one starts.
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
export const consume = (value) => value.stdout.length

// The check refuses what did not run the child as asked.
const good = cases.map(({ expected }) => ({ ...expected }))
verifyResults(good)
verifyResults(good.map(({ stdout, status }) => ({ stdout: stdout.slice(0, -1), status })))
const refuses = (change, what) => assert.throws(() => verifyResults(good.map((o, i) => change(o, i))), undefined, what)
refuses((o) => ({ stdout: '', status: 0 }), 'an empty output')
refuses((o, i) => (i === 3 ? { ...o, stdout: o.stdout.trimEnd() } : o), 'the trailing space of an empty last argument trimmed')
refuses((o, i) => (i === 5 ? { ...o, stdout: o.stdout.replace('$HOME', '/Users/someone') } : o), '$HOME expanded by a shell')
refuses((o, i) => (i === 1 ? { ...o, stdout: o.stdout.replace('*', 'a b c') } : o), 'a * expanded as a pattern')
refuses((o, i) => (i === 7 ? { ...o, stdout: new TextDecoder('latin1').decode(new TextEncoder().encode(o.stdout)) } : o), 'non-ASCII text re-encoded')
refuses((o) => ({ ...o, status: 1 }), 'a non-zero status')
refuses((o) => ({ ...o, status: null }), 'no status')
refuses((o, i) => good[(i + 1) % good.length], "another fixture's result")
refuses((o) => o.stdout, 'the output alone')
refuses((o, i) => cases[i].input, 'the input returned unchanged')
