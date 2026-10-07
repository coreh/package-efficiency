const compiled = new Map()
const regexFor = (pattern) => {
  let regex = compiled.get(pattern)
  if (!regex) compiled.set(pattern, regex = new RegExp(pattern, 'g'))
  return regex
}
export const operation = ({ pattern, text }) => text.match(regexFor(pattern)) ?? []
