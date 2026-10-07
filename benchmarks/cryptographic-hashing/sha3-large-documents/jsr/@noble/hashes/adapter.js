import { sha3_256 } from '@noble/hashes/sha3.js'
const encoder = new TextEncoder()
export const operation = value => sha3_256(encoder.encode(value))
