import { pluralize, singularize } from 'inflected'
export const operation = (words) => {
  const out = []
  for (let i = 0; i < words.length; i++) {
    const plural = pluralize(words[i])
    out.push(plural, singularize(plural))
  }
  return out
}
