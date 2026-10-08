import inflection from 'inflection'
export const operation = (words) => {
  const out = []
  for (let i = 0; i < words.length; i++) {
    const plural = inflection.pluralize(words[i])
    out.push(plural, inflection.singularize(plural))
  }
  return out
}
