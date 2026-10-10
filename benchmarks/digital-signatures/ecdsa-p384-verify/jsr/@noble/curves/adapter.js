import { p384 } from '@noble/curves/nist.js'
import { Buffer } from 'node:buffer'
const fromHex = Uint8Array.fromHex ? (hex) => Uint8Array.fromHex(hex) : (hex) => Buffer.from(hex, 'hex')
const utf8 = new TextEncoder()
// Untimed, once per fixture: hex becomes Uint8Array and the message its UTF-8 bytes.
export const prepare = ({ publicKey, signature, message }) => ({ publicKey: fromHex(publicKey), signature: fromHex(signature), message: utf8.encode(message) })
export const operation = ({ publicKey, signature, message }) => p384.verify(signature, message, publicKey)
