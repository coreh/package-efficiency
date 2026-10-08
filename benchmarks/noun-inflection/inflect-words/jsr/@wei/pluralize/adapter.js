import pluralize from '@wei/pluralize'
export const operation = (words) => {
  const out = []
  for (let i = 0; i < words.length; i++) {
    const plural = pluralize.plural(words[i])
    out.push(plural, pluralize.singular(plural))
  }
  return out
}
