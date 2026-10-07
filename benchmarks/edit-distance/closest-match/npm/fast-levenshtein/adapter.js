import levenshtein from 'fast-levenshtein'
export const operation = ([query, candidates]) => {
  let best = 0, bestDistance = Infinity
  for (let i = 0; i < candidates.length; i++) {
    const d = levenshtein.get(query, candidates[i])
    if (d < bestDistance) { bestDistance = d; best = i }
  }
  return best
}
