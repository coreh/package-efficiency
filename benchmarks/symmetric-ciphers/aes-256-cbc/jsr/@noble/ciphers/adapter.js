import { cbc } from '@noble/ciphers/aes.js'
const enc = new TextEncoder()
// Untimed, once per fixture: the three strings become byte arrays.
export const prepare = ({ key, iv, text }) => ({ key: enc.encode(key), iv: enc.encode(iv), text: enc.encode(text) })
export const operation = ({ key, iv, text }) => cbc(key, iv).encrypt(text)
