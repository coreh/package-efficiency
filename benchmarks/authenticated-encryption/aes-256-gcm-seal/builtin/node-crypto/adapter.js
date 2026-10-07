import { createCipheriv } from 'node:crypto'
// Untimed, once per fixture: the four strings become Buffers.
export const prepare = ({ key, nonce, aad, text }) => ({ key: Buffer.from(key), nonce: Buffer.from(nonce), aad: Buffer.from(aad), text: Buffer.from(text) })
export const operation = ({ key, nonce, aad, text }) => {
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  cipher.setAAD(aad)
  return Buffer.concat([cipher.update(text), cipher.final(), cipher.getAuthTag()])
}
