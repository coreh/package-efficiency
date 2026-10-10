import { sha1 } from '@noble/hashes/legacy.js'
// Untimed, once per fixture: the hex string becomes a Buffer (a Uint8Array).
export const prepare = value => Buffer.from(value, 'hex')
export const operation = bytes => sha1(bytes)
