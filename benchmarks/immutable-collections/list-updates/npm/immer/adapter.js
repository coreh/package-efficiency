import { produce } from 'immer'
export const operation = ({ items, ops }) => {
  let list = produce([], (d) => { d.push(...items) })
  const gets = []
  for (const [kind, i, v] of ops) {
    if (kind === 'set') list = produce(list, (d) => { d[i] = v })
    else if (kind === 'insert') list = produce(list, (d) => { d.splice(i, 0, v) })
    else if (kind === 'remove') list = produce(list, (d) => { d.splice(i, 1) })
    else gets.push(list[i])
  }
  return [list, gets]
}
