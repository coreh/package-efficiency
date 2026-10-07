import { gcm } from '@noble/ciphers/aes.js'
const enc = new TextEncoder()
const latin1 = (s) => {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
  return out
}
// Untimed, once per fixture: the four strings become byte arrays.
export const prepare = ({ key, nonce, aad, sealed }) => ({ key: enc.encode(key), nonce: enc.encode(nonce), aad: enc.encode(aad), sealed: latin1(sealed) })
export const operation = ({ key, nonce, aad, sealed }) => gcm(key, nonce, aad).decrypt(sealed)
