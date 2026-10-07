import { Minimatch } from 'minimatch'
export const operation = ({ pattern, paths }) => {
  const mm = new Minimatch(pattern)
  return paths.map((p) => mm.match(p))
}
