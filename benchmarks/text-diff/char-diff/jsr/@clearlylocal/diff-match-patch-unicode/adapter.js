import { Differ } from '@clearlylocal/diff-match-patch-unicode'
const differ = new Differ()
// Common shape: [op, count] runs. The library returns [op, text] pairs, so the
// count is the length of the text.
export const operation = ({ a, b }) => {
  const diffs = differ.diff(a, b)
  const out = new Array(diffs.length)
  for (let i = 0; i < diffs.length; i++) {
    const d = diffs[i]
    out[i] = [d[0] === 0 ? '=' : d[0] < 0 ? '-' : '+', d[1].length]
  }
  return out
}
