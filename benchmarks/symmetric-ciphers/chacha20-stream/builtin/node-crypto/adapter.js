import { createCipheriv } from 'node:crypto'
import { Buffer } from 'node:buffer'
// Untimed, once per fixture: the strings become Buffers, and the 16-byte IV
// OpenSSL takes is built: the 32-bit block counter 0 (little-endian), then the nonce.
export const prepare = ({ key, nonce, text }) => ({ key: Buffer.from(key), iv: Buffer.concat([Buffer.alloc(4), Buffer.from(nonce)]), text: Buffer.from(text) })
export const operation = ({ key, iv, text }) => {
  const cipher = createCipheriv('chacha20', key, iv)
  return Buffer.concat([cipher.update(text), cipher.final()])
}
