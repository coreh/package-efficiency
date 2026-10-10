import { Buffer } from 'node:buffer'
// Untimed, once per fixture: the hex string becomes a Buffer.
export const prepare = (value) => Buffer.from(value, 'hex')
export const operation = (bytes) => Bun.hash.xxHash64(bytes)
