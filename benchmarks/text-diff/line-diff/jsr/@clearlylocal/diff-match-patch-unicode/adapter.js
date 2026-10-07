import { Differ, segmenters } from '@clearlylocal/diff-match-patch-unicode'
const differ = new Differ()
// Common shape: [op, count] runs. The library returns [op, text] pairs where
// the text holds whole lines, so the lines of each run are counted by newline.
export const operation = ({ a, b }) => {
  const diffs = differ.diff(a, b, { segmenter: segmenters.line })
  const out = new Array(diffs.length)
  for (let i = 0; i < diffs.length; i++) {
    const d = diffs[i]
    const text = d[1]
    let n = 0
    for (let at = text.indexOf('\n'); at !== -1; at = text.indexOf('\n', at + 1)) n++
    out[i] = [d[0] === 0 ? '=' : d[0] < 0 ? '-' : '+', n]
  }
  return out
}
