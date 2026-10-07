import { hash, verify } from '@stdext/crypto/hash/scrypt'
const options = { logN: 12 }
export const operation = ([password, wrong]) => {
  const stored = hash(password, options)
  return [verify(password, stored), verify(wrong, stored)]
}
