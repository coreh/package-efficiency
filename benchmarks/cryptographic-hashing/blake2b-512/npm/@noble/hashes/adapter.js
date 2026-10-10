import { blake2b } from '@noble/hashes/blake2.js'
// Untimed, once per fixture: the hex string becomes a Buffer (a Uint8Array).
export const prepare = value => Buffer.from(value, 'hex')
export const operation = bytes => blake2b(bytes)
