import anymatch from 'anymatch'
export const operation = ({ pattern, paths }) => {
  const test = anymatch(pattern)
  return paths.map((p) => test(p))
}
