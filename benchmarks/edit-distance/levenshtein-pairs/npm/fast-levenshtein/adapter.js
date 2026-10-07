import levenshtein from 'fast-levenshtein'
export const operation = ([a, b]) => levenshtein.get(a, b)
