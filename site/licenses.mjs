// What kind of license a package has, from the name its registry gives.
// The kinds, from the fewest conditions to the most:
//   public-domain  no conditions at all (CC0, Unlicense, 0BSD)
//   permissive     keep the notice (MIT, Apache-2.0, BSD, ISC)
//   weak-copyleft  changes to the library itself stay open (LGPL, MPL, EPL)
//   copyleft       works that include it stay open (GPL, AGPL)
//   proprietary    use is restricted: commercial, source-available, non-commercial
//   other          named, but not one this table knows
// Registries hold expressions too. In "A OR B" the user chooses, so the kind is
// the least restrictive of the two; in "A AND B" both apply, so it is the most
// restrictive. This is a reading of the name, not legal advice.
export const LICENSE_KINDS = {
  'public-domain': 'Public domain',
  permissive: 'Permissive',
  'weak-copyleft': 'Weak copyleft',
  copyleft: 'Copyleft',
  proprietary: 'Proprietary or source-available',
  other: 'Other',
}
const ORDER = Object.keys(LICENSE_KINDS)
const RULES = [
  ['proprietary', /proprietary|commercial|busl|polyform|hippocratic|public use license|cc-by-nc|sspl|elastic/i],
  ['public-domain', /^(cc0|unlicense|0bsd|wtfpl|mit-0|public domain)/i],
  ['copyleft', /^(a?gpl|gnu affero|eupl|osl|cecill-[^b]|cc-by-sa)/i],
  ['weak-copyleft', /^(lgpl|mpl|epl|cddl|cpl|eclipse)/i],
  ['permissive', /^(mit|apache|bsd|isc|zlib|blueoak|unicode|psf|bsl-1|boost|ruby|afl|upl|zpl|cnri|tcl|artistic|cdla-permissive|cc-by-\d|ncsa|postgresql|python|x11|icu|hpnd|libpng|openssl|curl|ofl|vim)/i],
]
const one = (name) => RULES.find(([, pattern]) => pattern.test(name.trim()))?.[0] ?? 'other'
const worse = (a, b) => (ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b)
// "other" is the last of the order, but an unknown name beside a known choice
// does not take the choice away.
const better = (a, b) => (a === 'other' ? b : b === 'other' ? a : ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b)

// The parts of an expression at its top level, outside any brackets.
function split(text, word) {
  const parts = []
  let depth = 0, start = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (depth === 0 && text.startsWith(word, i)) { parts.push(text.slice(start, i)); start = i + word.length; i = start - 1 }
  }
  return [...parts, text.slice(start)]
}

export function licenseKind(license) {
  if (!license) return null
  let text = String(license).trim().replace(/ WITH [\w.-]+/g, '').replace(/^dual licensed\s*-\s*/i, '')
  // Free text that names a restricted license anywhere is that, whatever else it offers.
  if (!/^[\w.+() -]+$/.test(text) || / or | and /.test(text)) text = text.replace(/ or /g, ' OR ').replace(/ and /g, ' AND ').replace(/,\s*/g, ' AND ')
  const read = (part) => {
    part = part.trim()
    const choices = split(part, ' OR ')
    if (choices.length > 1) return choices.map(read).reduce(better)
    const all = split(part, ' AND ')
    if (all.length > 1) return all.map(read).reduce(worse)
    if (part.startsWith('(') && part.endsWith(')')) return read(part.slice(1, -1))
    return one(part)
  }
  return read(text)
}
