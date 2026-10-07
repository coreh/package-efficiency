import { Yallist } from 'yallist'
export const operation = ([window, items]) => {
  const queue = new Yallist()
  const out = []
  for (let i = 0; i < items.length; i++) {
    queue.push(items[i])
    if (queue.length > window) out.push(queue.shift())
  }
  const held = queue.length
  while (queue.length > 0) out.push(queue.shift())
  out.push(held)
  return out
}
