import Queue from 'yocto-queue'
export const operation = ([window, items]) => {
  const queue = new Queue()
  const out = []
  for (let i = 0; i < items.length; i++) {
    queue.enqueue(items[i])
    if (queue.size > window) out.push(queue.dequeue())
  }
  const held = queue.size
  while (queue.size > 0) out.push(queue.dequeue())
  out.push(held)
  return out
}
