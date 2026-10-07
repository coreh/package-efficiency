import micromatch from 'micromatch'
export const operation = ({ pattern, paths }) => {
  const isMatch = micromatch.matcher(pattern)
  return paths.map((p) => isMatch(p))
}
