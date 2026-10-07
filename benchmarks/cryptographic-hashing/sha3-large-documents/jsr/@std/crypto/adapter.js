import { crypto } from '@std/crypto'
const encoder = new TextEncoder()
export const operation = value => crypto.subtle.digestSync('SHA3-256', encoder.encode(value))
