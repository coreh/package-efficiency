import { crypto } from '@std/crypto'
const encoder = new TextEncoder()
export const operation = value => crypto.subtle.digestSync('MD5', encoder.encode(value))
