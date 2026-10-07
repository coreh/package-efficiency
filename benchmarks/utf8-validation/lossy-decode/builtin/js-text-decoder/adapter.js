import { Buffer } from 'node:buffer'
const decoder = new TextDecoder('utf-8', { ignoreBOM: true })
// Untimed, once per fixture: the hex string becomes the byte buffer.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => decoder.decode(bytes)
