export const operation = (items) => {
  const dq = []
  const out = []
  for (let i = 0; i < items.length; i++) {
    const x = items[i]
    const op = x & 3
    if (op === 0) dq.push(x)
    else if (op === 1) dq.unshift(x)
    else if (dq.length > 0) out.push(op === 2 ? dq.shift() : dq.pop())
  }
  out.push(-1)
  while (dq.length > 0) out.push(dq.shift())
  return out
}
