import { strict as assert } from 'node:assert'

// The nouns on which every package entered (npm, JSR, crates, PyPI, gems, Go
// modules) gives the same plural and gets the noun back as the singular of that
// plural. Found by running every package on about 300 common nouns; a noun on
// which two packages differ is not here and appears in no fixture (see task.md).
// Each entry is singular/plural.
const table = (
  'age/ages album/albums antenna/antennas apple/apples army/armies aunt/aunts baby/babies bag/bags banana/bananas bed/beds bench/benches ' +
  'berry/berries bikini/bikinis blanket/blankets body/bodies book/books boss/bosses bottle/bottles box/boxes boy/boys bridge/bridges ' +
  'brother/brothers brush/brushes bus/buses bush/bushes cage/cages car/cars cat/cats chair/chairs chief/chiefs chimney/chimneys church/churches ' +
  'city/cities class/classes cliff/cliffs cloud/clouds computer/computers copy/copies country/countries course/courses crash/crashes ' +
  'crisis/crises cross/crosses cuff/cuffs daughter/daughters day/days diagnosis/diagnoses dish/dishes ditch/ditches doctor/doctors dog/dogs ' +
  'donkey/donkeys door/doors dress/dresses egg/eggs engine/engines essay/essays factory/factories family/families father/fathers flag/flags ' +
  'flower/flowers fly/flies formula/formulas forum/forums fox/foxes garden/gardens glass/glasses grape/grapes guy/guys hobby/hobbies ' +
  'holiday/holidays horse/horses hotel/hotels image/images island/islands journey/journeys kangaroo/kangaroos key/keys keyboard/keyboards ' +
  'kiss/kisses kitchen/kitchens kiwi/kiwis lady/ladies lake/lakes lamp/lamps language/languages leg/legs lemon/lemons library/libraries ' +
  'loss/losses lunch/lunches machine/machines man/men mass/masses match/matches message/messages monkey/monkeys moon/moons moss/mosses ' +
  'mother/mothers mountain/mountains movie/movies mug/mugs news/news nurse/nurses ocean/oceans orange/oranges ox/oxen package/packages ' +
  'page/pages parenthesis/parentheses party/parties pass/passes patch/patches phone/phones photo/photos piano/pianos pig/pigs pillow/pillows ' +
  'planet/planets play/plays press/presses prognosis/prognoses proof/proofs puppy/puppies purse/purses quiz/quizzes radio/radios river/rivers ' +
  'road/roads roof/roofs rug/rugs sandwich/sandwiches school/schools screen/screens series/series sheep/sheep sister/sisters ski/skis ' +
  'sofa/sofas son/sons stage/stages star/stars status/statuses storm/storms story/stories street/streets student/students studio/studios ' +
  'synopsis/synopses table/tables teacher/teachers theatre/theatres thesis/theses toy/toys tree/trees turkey/turkeys uncle/uncles ' +
  'valley/valleys village/villages watch/watches way/ways window/windows wish/wishes witch/witches woman/women zoo/zoos'
)
  .split(' ')
  .map((p) => p.split('/'))

// Nouns whose plural is not made by adding s, es or ies to the singular.
const irregular = new Set(['crisis', 'diagnosis', 'man', 'woman', 'ox', 'parenthesis', 'prognosis', 'series', 'sheep', 'synopsis', 'thesis', 'news'])
const irregularPairs = table.filter(([s]) => irregular.has(s))
const regularPairs = table.filter(([s]) => !irregular.has(s))
assert.equal(irregularPairs.length, irregular.size)

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const rand = rng(20261007)

// 32 lists of 40 nouns: 6 irregular ones and 34 regular ones each, in a mixed order.
export const cases = []
for (let i = 0; i < 32; i++) {
  const chosen = []
  for (let k = 0; k < 6; k++) chosen.push(irregularPairs[(i * 6 + k) % irregularPairs.length])
  for (let k = 0; k < 34; k++) chosen.push(regularPairs[(i * 34 + k) % regularPairs.length])
  // Fisher-Yates with the seeded generator.
  for (let k = chosen.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1))
    ;[chosen[k], chosen[j]] = [chosen[j], chosen[k]]
  }
  const expected = []
  for (const [s, p] of chosen) expected.push(p, s)
  cases.push({ input: chosen.map(([s]) => s), expected })
}

const used = new Set(cases.flatMap((c) => c.input))
assert.equal(used.size, table.length, 'every noun appears in some fixture')

export const verifyOne = (i, output) => {
  assert.ok(Array.isArray(output), `fixture ${i}: a list is required`)
  const { input, expected } = cases[i]
  assert.equal(output.length, expected.length, `fixture ${i}: two forms per noun are required`)
  for (let k = 0; k < input.length; k++) {
    assert.equal(typeof output[2 * k], 'string', `fixture ${i}: plural of ${input[k]} is not a string`)
    assert.equal(output[2 * k], expected[2 * k], `fixture ${i}: plural of ${input[k]}`)
    assert.equal(output[2 * k + 1], input[k], `fixture ${i}: singular of ${expected[2 * k]}`)
  }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  cases.forEach((_, i) => verifyOne(i, outputs[i]))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check can fail. Each of these does not do the job and must be rejected on every fixture:
// the nouns returned unchanged, an "add s" pluralizer, and a rules-only inflector (s, es, ies,
// and the strip that undoes them) that knows no irregular noun.
const identity = (words) => words.flatMap((w) => [w, w])
const addS = (words) => words.flatMap((w) => [w + 's', w])
const rules = {
  plural: (w) => (/[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : /(s|x|z|ch|sh)$/.test(w) ? w + 'es' : w + 's'),
  singular: (w) => (/ies$/.test(w) ? w.slice(0, -3) + 'y' : /(ss|x|z|ch|sh)es$/.test(w) ? w.slice(0, -2) : /s$/.test(w) ? w.slice(0, -1) : w),
}
const rulesOnly = (words) => words.flatMap((w) => { const p = rules.plural(w); return [p, rules.singular(p)] })
for (const [name, weak] of Object.entries({ identity, addS, rulesOnly })) {
  cases.forEach((_, i) => assert.throws(() => verifyOne(i, weak(cases[i].input)), `${name} would pass fixture ${i}`))
}
