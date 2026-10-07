import { createCipheriv } from 'node:crypto'
// Untimed, once per fixture: the three strings become Buffers.
export const prepare = ({ key, iv, text }) => ({ key: Buffer.from(key), iv: Buffer.from(iv), text: Buffer.from(text) })
export const operation = ({ key, iv, text }) => {
  const cipher = createCipheriv('aes-256-ctr', key, iv)
  return Buffer.concat([cipher.update(text), cipher.final()])
}
