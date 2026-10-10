import { createHash } from 'node:crypto'
// Untimed, once per fixture: the hex string becomes a Buffer.
export const prepare = value => Buffer.from(value, 'hex')
export const operation = bytes => createHash('blake2b512').update(bytes).digest()
