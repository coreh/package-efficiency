import { createDecipheriv } from 'node:crypto'
// Untimed, once per fixture: the four strings become Buffers.
export const prepare = ({ key, nonce, aad, sealed }) => ({ key: Buffer.from(key), nonce: Buffer.from(nonce), aad: Buffer.from(aad), sealed: Buffer.from(sealed, 'latin1') })
export const operation = ({ key, nonce, aad, sealed }) => {
  const n = sealed.length - 16
  const decipher = createDecipheriv('aes-256-gcm', key, nonce)
  decipher.setAAD(aad)
  decipher.setAuthTag(sealed.subarray(n))
  return Buffer.concat([decipher.update(sealed.subarray(0, n)), decipher.final()])
}
