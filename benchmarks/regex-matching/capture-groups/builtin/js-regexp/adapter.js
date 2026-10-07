const compiled = new Map()
const regexFor = (pattern) => {
  let regex = compiled.get(pattern)
  if (!regex) compiled.set(pattern, regex = new RegExp(pattern, 'g'))
  return regex
}
// Each match is [whole, group1, ...]; the whole-match slot is dropped.
export const operation = ({ pattern, text }) => Array.from(text.matchAll(regexFor(pattern)), (m) => m.slice(1))
