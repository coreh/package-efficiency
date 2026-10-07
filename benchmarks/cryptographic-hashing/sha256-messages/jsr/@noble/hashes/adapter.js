import { sha256 } from '@noble/hashes/sha2.js'
const encoder = new TextEncoder()
export const operation = value => sha256(encoder.encode(value))
