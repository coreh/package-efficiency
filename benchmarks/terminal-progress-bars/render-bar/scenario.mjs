import { strict as assert } from 'node:assert'

// Each case: a bar with `total` units, advanced `steps` times by one. The
// percentages are whole (100, 75, 25, 100, 25) so no rounding rule matters.
export const cases = [
  { input: { total: 1000, steps: 1000 } },
  { input: { total: 400, steps: 300 } },
  { input: { total: 2000, steps: 500 } },
  { input: { total: 100, steps: 100 } },
  { input: { total: 800, steps: 200 } },
]

const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g
// A bar's optional head: a marker or a partial block between fill and rest.
const HEAD = new Set(['>', '▏', '▎', '▍', '▌', '▋', '▊', '▉', '▓', '▒'])

// The last non-blank line of the final frame, with cursor and colour codes
// removed. Carriage returns and line feeds both end a line.
const lastLine = (out) => {
  const lines = out.replace(ANSI, '').split(/[\r\n]+/).filter((l) => l.trim() !== '')
  return lines.length ? lines[lines.length - 1] : ''
}

export const check = (input, out, i = 0) => {
  assert.equal(typeof out, 'string', `fixture ${i}: a string (the last frame) is required`)
  const { total, steps } = input
  const fraction = steps / total
  const line = lastLine(out)
  assert.ok(line !== '', `fixture ${i}: nothing was drawn`)
  let evidence = 0

  // 1. A percentage, wherever the format puts it: all of them must be right.
  const percents = [...line.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => Number(m[1]))
  for (const p of percents) assert.ok(Math.abs(p - fraction * 100) < 0.5, `fixture ${i}: ${p}% in ${JSON.stringify(line)}`)
  if (percents.length) evidence++

  // 2. A count "done/total".
  const pairs = [...line.matchAll(/(\d+)\s*\/\s*(\d+)/g)].filter((m) => Number(m[2]) === total)
  for (const m of pairs) assert.equal(Number(m[1]), steps, `fixture ${i}: count ${m[0]} in ${JSON.stringify(line)}`)
  if (pairs.length) evidence++

  // 3. A bar between delimiters ([..] or |..|) with no letters or digits in it:
  // a filled prefix then an empty rest, the filled part the right share of the
  // width within a cell and a half.
  for (const m of line.matchAll(/[\[|]([^\[\]|]{10,})(?=[\]|])/gu)) {
    const cells = [...m[1]]
    if (cells.some((c) => /[\p{L}\p{N}:,]/u.test(c))) continue
    // The bar is one fill character, an optional head, then one other
    // character for the rest (or nothing): count the fill and the head.
    let filled = 0
    while (filled < cells.length && cells[filled] === cells[0]) filled++
    if (filled < cells.length && HEAD.has(cells[filled])) filled++
    const rest = cells.slice(filled)
    assert.ok(rest.every((c) => c === rest[0]) && rest[0] !== cells[0], `fixture ${i}: bar is not a filled prefix: ${JSON.stringify(line)}`)
    assert.ok(Math.abs(filled - fraction * cells.length) <= 1.5, `fixture ${i}: bar ${filled}/${cells.length} for ${steps}/${total}: ${JSON.stringify(line)}`)
    evidence++
    break
  }
  assert.ok(evidence > 0, `fixture ${i}: no percentage, count or bar in ${JSON.stringify(line)}`)
}

export const verifyOne = (i, out) => check(cases[i].input, out, i)
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  outputs.forEach((out, i) => verifyOne(i, out))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proof that the check can fail: outputs that did not do the job.
{
  const [a, b] = cases.map((c) => c.input)
  assert.throws(() => check(a, ''), /nothing was drawn/)
  assert.throws(() => check(a, 'done'), /no percentage/)
  assert.throws(() => check(b, '100%|##########| 1000/1000'), /%|count/) // the wrong state
  assert.throws(() => check(a, '[=====     ] 50%'), /%/) // half way is not done
  assert.throws(() => check(b, '[==========]'), /bar/) // full bar at 75%
  check(a, '\r\x1b[2K[==========] 100%')
  check(b, '|########  | 300/400')
}
