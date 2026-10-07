import { p256 } from '@noble/curves/nist.js'
import { Buffer } from 'node:buffer'
const encoder = new TextEncoder()
const fromHex = Uint8Array.fromHex ? (hex) => Uint8Array.fromHex(hex) : (hex) => Buffer.from(hex, 'hex')
export const operation = ({ publicKey, signature, message }) => p256.verify(fromHex(signature), encoder.encode(message), fromHex(publicKey))
