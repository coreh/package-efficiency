import { createHash } from 'node:crypto'
// Untimed, once per fixture: the hex string becomes a Buffer.
export const prepare = value => Buffer.from(value, 'hex')
export const operation = bytes => createHash('sha1').update(bytes).digest()
