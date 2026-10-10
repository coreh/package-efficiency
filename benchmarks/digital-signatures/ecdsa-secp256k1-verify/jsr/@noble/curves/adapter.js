import { secp256k1 } from '@noble/curves/secp256k1.js'
import { Buffer } from 'node:buffer'
const fromHex = Uint8Array.fromHex ? (hex) => Uint8Array.fromHex(hex) : (hex) => Buffer.from(hex, 'hex')
// Untimed, once per fixture: hex becomes Uint8Array.
export const prepare = ({ publicKey, signature, digest }) => ({ publicKey: fromHex(publicKey), signature: fromHex(signature), digest: fromHex(digest) })
export const operation = ({ publicKey, signature, digest }) => secp256k1.verify(signature, digest, publicKey, { prehash: false })
