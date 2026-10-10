export const operation = ({ a, b }) => {
  const sa = new Set(a)
  const sb = new Set(b)
  return [sa.union(sb), sa.intersection(sb), sa.difference(sb)]
}
