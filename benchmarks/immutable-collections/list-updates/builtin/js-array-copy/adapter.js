export const operation = ({ items, ops }) => {
  let list = items.slice()
  const gets = []
  for (const [kind, i, v] of ops) {
    if (kind === 'set') list = list.with(i, v)
    else if (kind === 'insert') list = list.toSpliced(i, 0, v)
    else if (kind === 'remove') list = list.toSpliced(i, 1)
    else gets.push(list[i])
  }
  return [list, gets]
}
