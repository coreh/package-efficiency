import { gcm } from '@noble/ciphers/aes.js'
const enc = new TextEncoder()
// Untimed, once per fixture: the four strings become byte arrays.
export const prepare = ({ key, nonce, aad, text }) => ({ key: enc.encode(key), nonce: enc.encode(nonce), aad: enc.encode(aad), text: enc.encode(text) })
export const operation = ({ key, nonce, aad, text }) => gcm(key, nonce, aad).encrypt(text)
