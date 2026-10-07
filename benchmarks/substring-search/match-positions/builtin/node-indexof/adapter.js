export const operation = ({ text, needle }) => {
  const out = []
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + needle.length)) out.push(i)
  return out
}
