import { RRegex } from '@rregex/rregex'
// Compiled once per pattern and kept for the life of the process, so never freed.
const compiled = new Map()
const regexFor = (pattern) => {
  let regex = compiled.get(pattern)
  if (!regex) compiled.set(pattern, regex = new RRegex(pattern))
  return regex
}
export const operation = ({ pattern, text }) => regexFor(pattern).capturesAll(text).map((c) => {
  const groups = c.get
  const out = new Array(groups.length - 1)
  for (let i = 1; i < groups.length; i++) out[i - 1] = groups[i].value
  return out
})
