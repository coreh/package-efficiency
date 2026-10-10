import { crypto } from '@std/crypto'
// Untimed, once per fixture: the hex string becomes a Buffer (a Uint8Array).
export const prepare = value => Buffer.from(value, 'hex')
export const operation = bytes => crypto.subtle.digestSync('BLAKE2B', bytes)
