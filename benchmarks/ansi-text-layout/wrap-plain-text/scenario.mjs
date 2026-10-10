import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'

// Plain words only: letters (some accented, all precomposed, one column each),
// no hyphens, slashes or punctuation, where wrappers break by different rules.
// The longest word has 14 letters, shorter than the narrowest width (40).
const words = ['a', 'to', 'of', 'in', 'is', 'the', 'and', 'for', 'data', 'value', 'queue', 'report', 'server', 'window', 'request', 'latency', 'build', 'records', 'between', 'résumé', 'café', 'naïve', 'über', 'señor', 'façade', 'jalapeño', 'déjà', 'élan', 'x', 'throughput', 'scheduler', 'configuration', 'documentation', 'international', 'responsibility', 'it', 'on', 'was', 'with', 'every', 'second', 'line', 'Zoë', 'Ångström', 'smörgåsbord']
const WIDTHS = [40, 72, 100]

// Deterministic xorshift32, so fixtures never change.
const paragraph = (seed, columns) => {
  let x = (seed * 2654435761 + 977) >>> 0 || 1
  const next = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x }
  const out = []
  let length = -1
  while (length < columns) {
    const w = words[next() % words.length]
    out.push(w)
    length += 1 + w.length
  }
  return out.join(' ')
}

// The scenario's own greedy first-fit wrap: a word goes on the current line if
// the line, a space and the word fit in the width; otherwise it starts a line.
// Lengths are in code points, which is columns for these words.
const len = (s) => [...s].length
const greedy = (text, width) => {
  const lines = []
  let line = ''
  for (const w of text.split(' ')) {
    if (line === '') line = w
    else if (len(line) + 1 + len(w) <= width) line += ' ' + w
    else { lines.push(line); line = w }
  }
  lines.push(line)
  return lines
}

// 30 paragraphs, 10 per width, of about 120 to 2,300 columns; the first of
// each width is shorter than the width, so the answer is one line.
const fixtures = []
for (let i = 0; i < 30; i++) {
  const width = WIDTHS[i % 3]
  const columns = i < 3 ? width - 12 : 120 + ((i * 397) % 2200)
  const text = paragraph(i + 1, columns)
  fixtures.push({ input: { text, width }, expected: greedy(text, width) })
}
export const cases = fixtures
assert.equal(cases.length, 30)
for (const { input: { text, width }, expected } of cases) {
  assert.equal(expected.join(' '), text)
  for (const line of expected) assert.ok(len(line) > 0 && len(line) <= width)
}

// A string is split on "\n" (one final "\n" allowed); a list is taken as the
// lines. Trailing spaces on a line are style and are removed before comparing.
const linesOf = (i, output) => {
  let lines
  if (typeof output === 'string') {
    lines = (output.endsWith('\n') ? output.slice(0, -1) : output).split('\n')
  } else if (Array.isArray(output)) {
    lines = output
    for (const l of lines) assert.equal(typeof l, 'string', `fixture ${i}: every line must be a string`)
  } else {
    assert.fail(`fixture ${i}: a string with "\\n" between lines, or a list of lines, is required`)
  }
  return lines.map((l) => l.replace(/[ \t]+$/, ''))
}
export const verifyOne = (i, output) => {
  const lines = linesOf(i, output)
  const { expected, input: { width } } = cases[i]
  assert.equal(lines.length, expected.length, `fixture ${i} (width ${width}): ${lines.length} lines, greedy gives ${expected.length}`)
  for (let j = 0; j < expected.length; j++) assert.equal(lines[j], expected[j], `fixture ${i} (width ${width}): line ${j + 1}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (let i = 0; i < cases.length; i++) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check accepts every spelling of the right lines.
verifyResults(cases.map(({ expected }) => expected))
verifyResults(cases.map(({ expected }) => expected.join('\n')))
verifyResults(cases.map(({ expected }) => expected.join('\n') + '\n'))
verifyResults(cases.map(({ expected }) => expected.map((l) => l + ' ')))

// Minimum raggedness (the sum of squared slack on every line but the last),
// the other common way to choose breaks: valid lines, not the greedy ones.
const balanced = (text, width) => {
  const ws = text.split(' ')
  const n = ws.length
  const cost = new Array(n + 1).fill(Infinity)
  const from = new Array(n + 1).fill(0)
  cost[n] = 0
  for (let i = n - 1; i >= 0; i--) {
    let l = -1
    for (let j = i; j < n; j++) {
      l += 1 + len(ws[j])
      if (l > width) break
      const c = (j === n - 1 ? 0 : (width - l) ** 2) + cost[j + 1]
      if (c < cost[i]) { cost[i] = c; from[i] = j + 1 }
    }
  }
  const lines = []
  for (let i = 0; i < n; i = from[i]) lines.push(ws.slice(i, from[i]).join(' '))
  return lines
}

// And refuses outputs that did not do the job.
const wrong = {
  'the input unchanged': cases.map(({ input }) => input.text),
  'a wrap to one column less': cases.map(({ input: { text, width } }) => greedy(text, width - 1)),
  'a wrap to one column more': cases.map(({ input: { text, width } }) => greedy(text, width + 1)),
  'a wrap that counts UTF-8 bytes': cases.map(({ input: { text, width } }) => {
    const lines = []
    let line = ''
    const bytes = (s) => Buffer.byteLength(s)
    for (const w of text.split(' ')) {
      if (line === '') line = w
      else if (bytes(line) + 1 + bytes(w) <= width) line += ' ' + w
      else { lines.push(line); line = w }
    }
    lines.push(line)
    return lines
  }),
  'minimum-raggedness breaks': cases.map(({ input: { text, width } }) => balanced(text, width)),
  'lines with a leading space': cases.map(({ expected }) => expected.map((l, j) => (j ? ' ' + l : l))),
  'a blank line between lines': cases.map(({ expected }) => expected.join('\n\n')),
  'a word dropped': cases.map(({ expected }) => expected.map((l, j) => (j === expected.length - 1 ? l.split(' ').slice(0, -1).join(' ') || 'x' : l))),
  "another fixture's lines": cases.map((_, i) => cases[(i + 1) % cases.length].expected),
  'a constant': cases.map(() => ['the']),
}
for (const [name, outputs] of Object.entries(wrong)) assert.throws(() => verifyResults(outputs), undefined, `${name} must be refused`)
