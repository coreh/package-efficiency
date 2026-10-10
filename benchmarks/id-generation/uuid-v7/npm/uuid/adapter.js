import { v7 } from 'uuid'
export const operation = (count) => {
  const ids = new Array(count)
  for (let i = 0; i < count; i++) ids[i] = v7()
  return ids
}
