export const operation = (count) => {
  const ids = new Array(count)
  for (let i = 0; i < count; i++) ids[i] = Bun.randomUUIDv7()
  return ids
}
