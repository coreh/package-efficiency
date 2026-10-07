export const operation = ({ text, needles }) => needles.map((n) => {
  let count = 0
  for (let i = text.indexOf(n); i !== -1; i = text.indexOf(n, i + n.length)) count++
  return count
})
