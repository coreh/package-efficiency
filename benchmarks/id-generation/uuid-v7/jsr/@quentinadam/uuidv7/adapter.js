import { generateUUIDv7 } from '@quentinadam/uuidv7'
export const operation = (count) => {
  const ids = new Array(count)
  for (let i = 0; i < count; i++) ids[i] = generateUUIDv7()
  return ids
}
