import { createCipheriv } from 'node:crypto'
// Untimed, once per fixture: the four strings become Buffers.
export const prepare = ({ key, nonce, aad, text }) => ({ key: Buffer.from(key), nonce: Buffer.from(nonce), aad: Buffer.from(aad), text: Buffer.from(text) })
export const operation = ({ key, nonce, aad, text }) => {
  const cipher = createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 })
  cipher.setAAD(aad)
  return Buffer.concat([cipher.update(text), cipher.final(), cipher.getAuthTag()])
}
