import { strict as assert } from 'node:assert'
import { Buffer } from 'node:buffer'

// Independent Jaro reference over code points. `window: false` drops the
// matching window and `bytes: true` compares UTF-8 bytes; both exist only to
// prove below that the check refuses those mistakes.
const jaroParts = (a, b, { window = true, bytes = false } = {}) => {
  const x = bytes ? [...Buffer.from(a, 'utf8')] : [...a], y = bytes ? [...Buffer.from(b, 'utf8')] : [...b]
  if (x.length === 0 && y.length === 0) return { sim: 1, m: 0, mismatches: 0 }
  if (x.length === 0 || y.length === 0) return { sim: 0, m: 0, mismatches: 0 }
  const range = window ? Math.max(0, Math.floor(Math.max(x.length, y.length) / 2) - 1) : Math.max(x.length, y.length)
  const fx = new Array(x.length).fill(false), fy = new Array(y.length).fill(false)
  let m = 0
  for (let i = 0; i < x.length; i++) {
    for (let j = Math.max(0, i - range); j <= Math.min(y.length - 1, i + range); j++) {
      if (!fy[j] && x[i] === y[j]) { fx[i] = fy[j] = true; m++; break }
    }
  }
  let mismatches = 0
  for (let i = 0, k = 0; i < x.length; i++) {
    if (!fx[i]) continue
    while (!fy[k]) k++
    if (x[i] !== y[k]) mismatches++
    k++
  }
  const t = Math.floor(mismatches / 2)
  const sim = m === 0 ? 0 : (m / x.length + m / y.length + (m - t) / m) / 3
  return { sim, m, mismatches }
}
const prefixOf = (a, b, cap = 4) => {
  const x = [...a], y = [...b]
  let p = 0
  while (p < cap && p < x.length && p < y.length && x[p] === y[p]) p++
  return p
}
// Jaro-Winkler with prefix scale 0.1 and a prefix of at most 4, bonus above 0.7.
const jaroWinkler = (a, b, { scale = 0.1, cap = 4, ...options } = {}) => {
  const { sim } = jaroParts(a, b, options)
  return sim > 0.7 ? sim + prefixOf(a, b, cap) * scale * (1 - sim) : sim
}

// The reference against published values (Winkler 1990; strsim's doc tests).
const near = (x, y, eps) => Math.abs(x - y) < eps
assert.ok(near(jaroParts('MARTHA', 'MARHTA').sim, 0.944444, 1e-6))
assert.ok(near(jaroWinkler('MARTHA', 'MARHTA'), 0.961111, 1e-6))
assert.ok(near(jaroParts('DWAYNE', 'DUANE').sim, 0.822222, 1e-6))
assert.ok(near(jaroWinkler('DWAYNE', 'DUANE'), 0.84, 1e-6))
assert.ok(near(jaroParts('DIXON', 'DICKSONX').sim, 0.766667, 1e-6))
assert.ok(near(jaroWinkler('DIXON', 'DICKSONX'), 0.813333, 1e-6))
assert.ok(near(jaroWinkler('cheeseburger', 'cheese fries'), 0.866, 1e-3))

// Deterministic generator (linear congruential), so fixtures never change.
let seed = 20261009
const next = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor((seed / 4294967296) * n) }
const pick = (list) => list[next(list.length)]
const given = ['james', 'mary', 'robert', 'patricia', 'john', 'jennifer', 'michael', 'linda', 'william', 'elizabeth', 'david', 'barbara', 'richard', 'susan', 'joseph', 'jessica', 'thomas', 'sarah', 'charles', 'karen', 'christopher', 'nancy', 'daniel', 'margaret', 'matthew', 'katherine', 'anthony', 'dorothy', 'mark', 'stephanie', 'martha', 'dwayne', 'dixon', 'jonathan', 'catherine', 'alexander', 'maximilian', 'theodore']
const family = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez', 'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thompson', 'taylor', 'moore', 'jackson', 'martin', 'lee', 'perez', 'white', 'harris', 'sanchez', 'clark', 'ramirez', 'lewis', 'robinson', 'walker', 'young', 'allen', 'king', 'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores', 'mcallister', 'oconnell', 'abernathy', 'fitzgerald']
const words = ['install', 'uninstall', 'update', 'upgrade', 'remove', 'configure', 'compile', 'transpile', 'bundle', 'deploy', 'publish', 'registry', 'workspace', 'dependency', 'manifest', 'template', 'coverage', 'snapshot', 'benchmark', 'profile', 'inspect', 'restart', 'checkout', 'branch', 'commit', 'connection', 'transaction', 'serializer', 'middleware', 'controller', 'repository', 'interface', 'parameter', 'attribute', 'property', 'directory', 'filename', 'timeout']
const streets = ['main street', 'oak avenue', 'maple drive', 'cedar lane', 'elm street', 'park road', 'washington boulevard', 'lake view terrace', 'sunset strip', 'highland avenue', 'church street', 'mill road']
const latin1Given = ['josé', 'maría', 'françois', 'jürgen', 'søren', 'zoë', 'andré', 'inés', 'björn', 'renée', 'mélanie', 'ýrr', 'célia', 'jérôme', 'hélène', 'joão', 'günther', 'åsa', 'ñuño', 'noël']
const latin1Family = ['müller', 'gonzález', 'pérez', 'núñez', 'østergaard', 'fernández', 'gómez', 'schäfer', 'lefèvre', 'åkesson', 'jäger', 'françois', 'brontë', 'hernández', 'weiß', 'dvorak', 'çelik', 'ramírez', 'löwe', 'thór']
const letters = 'abcdefghijklmnopqrstuvwxyz'
const latin1Letters = 'abcdefghijklmnopqrstuvwxyzáéíóúñüöäåøßçèêëàâîïôûÿ'
const typo = (s, alphabet) => {
  const c = [...s]
  const pos = next(c.length)
  switch (next(5)) {
    case 0: if (c.length > 3) c.splice(pos, 1); else c[pos] = alphabet[next(alphabet.length)]; break
    case 1: c.splice(pos, 0, c[pos]); break
    case 2: if (pos + 1 < c.length) [c[pos], c[pos + 1]] = [c[pos + 1], c[pos]]; else c[pos] = alphabet[next(alphabet.length)]; break
    case 3: c[pos] = [...alphabet][next([...alphabet].length)]; break
    default: c.splice(pos, 0, [...alphabet][next([...alphabet].length)]); break
  }
  return c.join('')
}
const typos = (s, n, alphabet) => { for (let k = 0; k < n; k++) s = typo(s, alphabet); return s }
// A first-letter change, so the pair has no common prefix.
const headless = (s, alphabet) => { const c = [...s]; let r; do r = [...alphabet][next([...alphabet].length)]; while (r === c[0]); c[0] = r; return c.join('') }

// Each mix makes one candidate pair; a pair is kept only if it is in the job
// (see `inJob`).
const mixes = [
  // Person names "given family" with typos, as in record linkage.
  () => { const s = `${pick(given)} ${pick(family)}`; return [s, typos(s, 1 + next(3), letters)] },
  // Surnames alone, short strings.
  () => { const s = pick(family); return [s, next(4) === 0 ? headless(s, letters) : typos(s, 1 + next(2), letters)] },
  // Identifiers and command words, some sharing a long prefix (cap at 4).
  () => { const s = pick(words); const r = next(3); return [s, r === 0 ? s.slice(0, Math.max(5, s.length - 2 - next(3))) + pick(['ed', 'er', 'ing', 's', 'ion']) : r === 1 ? headless(typo(s, letters), letters) : typos(s, 1 + next(3), letters)] },
  // Street addresses with a house number, longer strings.
  () => { const s = `${1 + next(9999)} ${pick(streets)}`; return [s, next(3) === 0 ? s.replace(/^\d+/, String(1 + next(9999))) : typos(s, 2 + next(4), letters)] },
  // Mixed: identical, swapped adjacent words, and far but still above the threshold.
  () => { const s = `${pick(given)} ${pick(family)}`; const r = next(4); return [s, r === 0 ? s : r === 1 ? s.split(' ').reverse().join(' ') : typos(s, 3 + next(4), letters)] },
  // Latin-1 names: every character is one code point below U+0100.
  () => { const s = `${pick(latin1Given)} ${pick(latin1Family)}`; return [s, next(5) === 0 ? headless(s, latin1Letters) : typos(s, 1 + next(3), latin1Letters)] },
]
// A pair is in the job when its Jaro similarity is at least 0.72 (packages
// differ on whether the 0.7 threshold disables the prefix bonus, and the
// margin keeps `>` against `>=` and rounding out of it), when matching from
// either string gives the same matches and transpositions (some packages
// swap the strings so the shorter one leads), and when the number of
// out-of-order matched characters is even (so halving it needs no rounding).
const inJob = ([a, b]) => {
  if ([...a].length < 3 || [...b].length < 3) return false
  const ab = jaroParts(a, b), ba = jaroParts(b, a)
  return ab.sim >= 0.72 && ab.m === ba.m && ab.mismatches === ba.mismatches && ab.mismatches % 2 === 0
}
const PER_CASE = 200
const batches = mixes.map((make) => {
  const pairs = []
  while (pairs.length < PER_CASE) { const pair = make(); if (inJob(pair)) pairs.push(pair) }
  return pairs
})
// Fixed pairs at the start of the first case: the published examples and the edges.
batches[0].splice(0, 6, ['martha', 'marhta'], ['dwayne', 'duane'], ['dixon', 'dicksonx'], ['jellyfish', 'jellyfish'], ['abcdefgh', 'abcdefxy'], ['crate', 'trace'])
for (const pairs of batches) for (const pair of pairs) assert.ok(inJob(pair), `pair out of the job: ${JSON.stringify(pair)}`)

export const cases = batches.map((pairs) => ({ input: pairs, expected: pairs.map(([a, b]) => jaroWinkler(a, b)) }))

// The fixtures are what task.md says.
const all = batches.flat()
assert.equal(all.length, 1200)
assert.ok(all.every(([a, b]) => /^[\x20-\x7e]+$/.test(a + b)) === false)
assert.ok(batches.slice(0, 5).flat().every(([a, b]) => /^[\x20-\x7e]+$/.test(a + b)), 'cases 0 to 4 are ASCII')
assert.ok(batches[5].every(([a, b]) => /^[\x20-\xff]+$/.test(a + b) && /[^\x00-\x7f]/.test(a + b)), 'case 5 is Latin-1 with at least one non-ASCII character per pair')
const prefixCounts = [0, 0, 0, 0, 0]
for (const [a, b] of all) prefixCounts[prefixOf(a, b)]++
assert.ok(prefixCounts.every((n) => n >= 20), `every prefix length 0 to 4 occurs: ${prefixCounts}`)
assert.ok(all.filter(([a, b]) => prefixOf(a, b, 99) > 4 && a !== b).length >= 20, 'some pairs share more than 4 leading characters')

const TOLERANCE = 1e-9
export const verifyOne = (i, actual) => {
  const { input, expected } = cases[i]
  assert.ok(Array.isArray(actual), `fixture ${i}: array of numbers required`)
  assert.equal(actual.length, expected.length, `fixture ${i}: one similarity per pair`)
  for (let j = 0; j < expected.length; j++) {
    assert.equal(typeof actual[j], 'number', `fixture ${i}[${j}] ${JSON.stringify(input[j])}: number required, got ${typeof actual[j]}`)
    assert.ok(Math.abs(actual[j] - expected[j]) <= TOLERANCE, `fixture ${i}[${j}] ${JSON.stringify(input[j])}: expected ${expected[j]}, got ${actual[j]}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// Proofs that the check refuses wrong outputs, for every fixture.
for (const [i, { input }] of cases.entries()) {
  // Plain Jaro (no prefix bonus), a distance instead of a similarity.
  assert.throws(() => verifyOne(i, input.map(([a, b]) => jaroParts(a, b).sim)), /fixture/)
  assert.throws(() => verifyOne(i, cases[i].expected.map((v) => 1 - v)), /fixture/)
  // The prefix not capped at 4, a prefix scale of 0.25, matching without a window.
  if (i < 5) assert.throws(() => verifyOne(i, input.map(([a, b]) => jaroWinkler(a, b, { cap: 99 }))), /fixture/)
  assert.throws(() => verifyOne(i, input.map(([a, b]) => jaroWinkler(a, b, { scale: 0.25 }))), /fixture/)
  assert.throws(() => verifyOne(i, input.map(([a, b]) => jaroWinkler(a, b, { window: false }))), /fixture/)
  // Rounded to 3 decimals, one value missing, another fixture's results.
  assert.throws(() => verifyOne(i, cases[i].expected.map((v) => Math.round(v * 1000) / 1000)), /fixture/)
  assert.throws(() => verifyOne(i, cases[i].expected.slice(1)), /one similarity per pair/)
  assert.throws(() => verifyOne(i, cases[(i + 1) % cases.length].expected), /fixture/)
  assert.throws(() => verifyOne(i, input), /number required/)
}
// UTF-8 bytes instead of code points, on the Latin-1 case.
assert.throws(() => verifyOne(5, cases[5].input.map(([a, b]) => jaroWinkler(a, b, { bytes: true }))), /fixture 5/)
