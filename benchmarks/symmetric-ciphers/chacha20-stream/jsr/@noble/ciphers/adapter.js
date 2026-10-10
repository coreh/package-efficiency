import { chacha20 } from '@noble/ciphers/chacha.js'
const enc = new TextEncoder()
// Untimed, once per fixture: the three strings become byte arrays.
export const prepare = ({ key, nonce, text }) => ({ key: enc.encode(key), nonce: enc.encode(nonce), text: enc.encode(text) })
export const operation = ({ key, nonce, text }) => chacha20(key, nonce, text)
