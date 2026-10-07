import { Buffer } from 'node:buffer'
import { detect } from 'chardet'
// Untimed, once per fixture: the hex string becomes the byte buffer.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => detect(bytes)
