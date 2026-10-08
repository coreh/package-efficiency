import { strict as assert } from 'node:assert'

// The characters the packages agree on, with the ASCII text all of them give.
// Taken from running every package (npm, crates, PyPI, gems, Go modules) on each
// letter of Latin-1, Latin Extended-A, Cyrillic and Greek; a letter on which two
// packages differ is not here and appears in no fixture (see task.md).
const pairs = (s) => Object.fromEntries(s.split(' ').map((p) => [p[0], p.slice(1)]))
const table = pairs(
  'ÀA ÁA ÂA ÃA ÅA ÇC ÈE ÉE ÊE ËE ÌI ÍI ÎI ÏI ÐD ÑN ÒO ÓO ÔO ÕO ØO ÙU ÚU ÛU ßss àa áa âa ãa åa æae çc èe ée êe ëe ìi íi îi ïi ðd ñn òo óo ôo õo øo ùu úu ûu ýy þth ÿy ' +
  'ĀA āa ĂA ăa ĄA ąa ĆC ćc ĈC ĉc ĊC ċc ČC čc ĎD ďd ĐD đd ĒE ēe ĔE ĕe ĖE ėe ĘE ęe ĚE ěe ĜG ĝg ĞG ğg ĠG ġg ĢG ģg ĤH ĥh ĦH ħh ĨI ĩi ĪI īi ĬI ĭi ĮI įi İI ıi ĴJ ĵj ĶK ķk ĹL ĺl ĻL ļl ĽL ľl ŁL łl ' +
  'ŃN ńn ŅN ņn ŇN ňn ŌO ōo ŎO ŏo ŐO őo œoe ŔR ŕr ŖR ŗr ŘR řr ŚS śs ŜS ŝs ŞS şs ŠS šs ŢT ţt ŤT ťt ŨU ũu ŪU ūu ŬU ŭu ŮU ůu ŰU űu ŲU ųu ŴW ŵw ŶY ŷy ŸY ŹZ źz ŻZ żz ŽZ žz ' +
  'АA БB ВV ДD ЖZh ЗZ ИI КK ЛL МM НN ОO ПP РR СS ТT УU ФF ЧCh ШSh ЫY ЭE аa бb вv дd жzh зz иi кk лl мm нn оo пp рr сs тt уu фf чch шsh ыy эe ' +
  'ΑA ΓG ΔD ΕE ΖZ ΙI ΚK ΛL ΜM ΝN ΟO ΠP ΡR ΣS ΤT ΩO άa έe ίi αa γg δd εe ζz θth ιi κk λl μm νn οo πp ρr ςs σs τt ψps ωo'
)

const words = [
  // Latin letters with diacritics
  'Crème', 'brûlée', 'Århus', 'Åre', 'São', 'Paulo', 'Çanakkale', 'Łódź', 'Dvořák', 'Čeština', 'Smørrebrød', 'Žižek', 'Gdańsk',
  'Braşov', 'Kraków', 'Málaga', 'Møller', 'Ísland', 'Straße', 'Français', 'naïve', 'Ñandú', 'Niño', 'Škoda', 'Győr', 'þing', 'Garðar', 'façade', 'jalapeño',
  'piñata', 'Zażółć', 'gęślą', 'encyclopædia', 'İstanbul', 'Iğdır', 'Šiauliai', 'Ūdens', 'Mūsų', 'Tromsø', 'ĉu', 'ĵaŭdo', 'déjà', 'vu', 'Écoute', 'Hrønn',
  'Ørsted', 'Bœuf', 'Sóller', 'Ångermanland', 'Čapek', 'Őrség', 'Ūpė', 'Łukasz', 'Gaëlle', 'Noël', 'Ibérica',
  // Cyrillic
  'Москва', 'Новосибирск', 'Самара', 'Томск', 'Омск', 'Тула', 'Курск', 'волна', 'рыбак', 'мир', 'дом', 'школа', 'сад', 'лампа', 'завод', 'зима', 'поток',
  'Фабрика', 'ширина', 'почта', 'вокзал', 'паром', 'мост', 'Школа', 'Вокзал', 'Кино',
  // Greek
  'Σπάρτα', 'Κάλαμος', 'Λάρισα', 'Πάτρα', 'Σάμος', 'Κάρπαθος', 'Δέλτα', 'Μέγαρα', 'Ελάτεια', 'Σαλαμίς', 'Αίγινα', 'ψάρι',
  // Plain ASCII, digits and punctuation
  'of', 'the', 'and', 'No.', '7', '2026', 'Vol.', '3', 'A/B', '(draft)', '&', '-', ':', 'Part', 'II', 'edition', '100%', '#1', 'Q&A',
]
const nonAscii = (s) => Array.from(s).filter((c) => c.charCodeAt(0) > 127)
for (const w of words) for (const c of nonAscii(w)) assert.ok(table[c], `word ${w} uses ${c}, which has no agreed value`)

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const transliterateReference = (s) => Array.from(s, (c) => table[c] ?? c).join('')

const rand = rng(20261007)
const titles = []
for (let i = 0; i < 64; i++) {
  const parts = []
  let length = 0
  while (length < 76 + (i % 9)) {
    const w = words[Math.floor(rand() * words.length)]
    parts.push(w)
    length += w.length + 1
  }
  titles.push(parts.join(' '))
}
// Pure-ASCII titles must come through untouched.
titles.push('The Art of Computer Programming, Vol. 3: Sorting and Searching (2nd edition)', 'Q&A #1 - Part II of the draft, No. 7 (100%)')

export const cases = titles.map((input) => ({ input, expected: transliterateReference(input) }))

export const verifyOne = (i, output) => {
  assert.equal(typeof output, 'string', `fixture ${i}: a string is required`)
  assert.equal(output, cases[i].expected, `fixture ${i}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  cases.forEach((_, i) => verifyOne(i, outputs[i]))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length

// The check can fail: input unchanged, or accents stripped by normalization alone.
const stripMarks = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '')
let weak = 0
for (const [i, { input, expected }] of cases.entries()) {
  if (nonAscii(input).length === 0) continue
  assert.notEqual(input, expected)
  assert.notEqual(stripMarks(input), expected, `fixture ${i} would pass with NFKD alone`)
  weak++
}
assert.ok(weak >= 60)
assert.ok(cases.every(({ expected }) => nonAscii(expected).length === 0))
