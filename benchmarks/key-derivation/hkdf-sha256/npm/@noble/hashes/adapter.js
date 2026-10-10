import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
const bytes = (hex) => Uint8Array.from(Buffer.from(hex, 'hex'))
// Untimed, once per fixture: the hex strings become Uint8Arrays.
export const prepare = ({ ikm, salt, info, length }) => ({ ikm: bytes(ikm), salt: bytes(salt), info: bytes(info), length })
export const operation = ({ ikm, salt, info, length }) => hkdf(sha256, ikm, salt, info, length)
