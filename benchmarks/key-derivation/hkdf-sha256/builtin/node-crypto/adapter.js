import { hkdfSync } from 'node:crypto'
// Untimed, once per fixture: the hex strings become Buffers.
export const prepare = ({ ikm, salt, info, length }) => ({ ikm: Buffer.from(ikm, 'hex'), salt: Buffer.from(salt, 'hex'), info: Buffer.from(info, 'hex'), length })
export const operation = ({ ikm, salt, info, length }) => hkdfSync('sha256', ikm, salt, info, length)
