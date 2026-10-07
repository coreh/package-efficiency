import { strict as assert } from 'node:assert'
// Deterministic, realistic indented blocks: code, YAML, prose, SQL, HTML, with
// base indentation 2..16 spaces, nested relative indentation, empty lines.
const snippets = [
  ['function area(w, h) {', '  if (w < 0 || h < 0) {', '    throw new RangeError("negative")', '  }', '', '  return w * h', '}'],
  ['server:', '  host: example.test', '  ports:', '    - 80', '    - 443', '', 'logging:', '  level: info'],
  ['SELECT u.id, u.name', '  FROM users u', '  JOIN orders o ON o.user_id = u.id', ' WHERE o.total > 100', ' ORDER BY u.name'],
  ['<ul>', '  <li class="item">One</li>', '  <li class="item">Two</li>', '    <ul>', '      <li>Nested</li>', '    </ul>', '</ul>'],
  ['Usage: tool [options] <file>', '', 'Options:', '  -h, --help     Show help', '  -v, --version  Print version', '  -q, --quiet    Suppress output'],
  ['def fib(n):', '    a, b = 0, 1', '    for _ in range(n):', '        a, b = b, a + b', '    return a'],
  ['The quick brown fox jumps over the lazy dog.', 'Pack my box with five dozen liquor jugs.', '', 'Sphinx of black quartz, judge my vow.'],
  ['fn main() {', '    let v: Vec<u32> = (1..=10).collect();', '    for x in &v {', '        println!("{x}");', '    }', '}'],
]
const make = (i) => {
  const base = [2, 4, 8, 12, 16, 3, 6, 10][i % 8]
  const pad = ' '.repeat(base)
  const snippet = snippets[(i * 3 + (i >> 3)) % snippets.length]
  const copies = 1 + (i % 6) * (i % 4 === 3 ? 4 : 1)
  const lines = []
  for (let c = 0; c < copies; c++) {
    for (const line of snippet) lines.push(line === '' ? '' : pad + line)
    if (c < copies - 1) lines.push('')
  }
  // Blocks start with a newline (as a template literal does) and end with one.
  return '\n' + lines.join('\n') + '\n'
}
const reference = (s) => {
  const lines = s.split('\n')
  let min = Infinity
  for (const l of lines) if (l !== '') min = Math.min(min, l.length - l.trimStart().length)
  return lines.map((l) => l.slice(min)).join('\n')
}
// Accepted: packages may drop the leading newline and trailing whitespace
// (template-literal style trimming). Indentation of every kept line is checked.
const normalize = (s) => s.replace(/^\n+/, '').trimEnd()
export const cases = Array.from({ length: 48 }, (_, i) => {
  const input = make(i)
  return { input, expected: reference(input) }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { input, expected }] of cases.entries()) {
    assert.equal(typeof outputs[i], 'string', `fixture ${i}: string output required`)
    assert.equal(normalize(outputs[i]), normalize(expected), `fixture ${i}`)
    // Fixtures with base indentation must actually change.
    if (/^\n +/.test(input)) assert.notEqual(outputs[i], input, `fixture ${i}: input returned unchanged`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
