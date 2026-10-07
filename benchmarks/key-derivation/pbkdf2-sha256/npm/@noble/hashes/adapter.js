import { pbkdf2 } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'
export const operation = ({ password, salt, iterations, length }) => pbkdf2(sha256, password, salt, { c: iterations, dkLen: length })
