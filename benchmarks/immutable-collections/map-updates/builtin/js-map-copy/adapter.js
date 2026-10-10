export const operation = ({ entries, ops, keep, lookups }) => {
  let m = new Map(Object.entries(entries))
  const kept = keep[0] === 0 ? [m] : []
  for (let n = 0; n < ops.length; n++) {
    const [kind, k, v] = ops[n]
    m = new Map(m)
    if (kind === 'set') m.set(k, v)
    else m.delete(k)
    if (keep.includes(n + 1)) kept.push(m)
  }
  return kept.map((m) => [m.size, lookups.map((k) => m.get(k) ?? null)])
}
