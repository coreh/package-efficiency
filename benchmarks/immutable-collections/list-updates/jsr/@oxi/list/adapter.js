import { List } from '@oxi/list'
export const operation = ({ items, ops }) => {
  let list = List.from(items)
  const gets = []
  for (const [kind, i, v] of ops) {
    if (kind === 'set') list = list.replaceAt(i, v)
    else if (kind === 'insert') list = list.insertAt(i, v)
    else if (kind === 'remove') list = list.removeAt(i)
    else gets.push(list.at(i).unwrap())
  }
  return [list.toArray(), gets]
}
