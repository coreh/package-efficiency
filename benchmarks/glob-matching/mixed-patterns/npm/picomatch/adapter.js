import picomatch from 'picomatch'
export const operation = ({ pattern, paths }) => {
  const isMatch = picomatch(pattern)
  return paths.map((p) => isMatch(p))
}
