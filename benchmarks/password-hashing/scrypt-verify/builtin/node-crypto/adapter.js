import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
const options = { N: 4096, r: 8, p: 1 }
export const operation = ([password, wrong]) => {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 32, options)
  return [
    timingSafeEqual(scryptSync(password, salt, 32, options), key),
    timingSafeEqual(scryptSync(wrong, salt, 32, options), key),
  ]
}
