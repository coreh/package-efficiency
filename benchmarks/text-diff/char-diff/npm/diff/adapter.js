import { diffChars } from 'diff'
// Common shape: [op, count] runs, one per part the library returns.
export const operation = ({ a, b }) => {
  const parts = diffChars(a, b)
  const out = new Array(parts.length)
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    out[i] = [p.added ? '+' : p.removed ? '-' : '=', p.count]
  }
  return out
}
