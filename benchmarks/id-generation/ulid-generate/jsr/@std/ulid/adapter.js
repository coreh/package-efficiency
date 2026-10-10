import { ulid } from '@std/ulid'
export const operation = (count) => {
  const ids = new Array(count)
  for (let i = 0; i < count; i++) ids[i] = ulid()
  return ids
}
