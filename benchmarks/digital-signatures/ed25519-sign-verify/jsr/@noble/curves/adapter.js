import { ed25519 } from '@noble/curves/ed25519.js'
import { Buffer } from 'node:buffer'
const encoder = new TextEncoder()
const fromHex = Uint8Array.fromHex ? (hex) => Uint8Array.fromHex(hex) : (hex) => Buffer.from(hex, 'hex')
export const operation = ({ seed, publicKey, message }) => {
  const bytes = encoder.encode(message)
  const signature = ed25519.sign(bytes, fromHex(seed))
  if (!ed25519.verify(signature, bytes, fromHex(publicKey))) throw new Error('signature did not verify')
  return signature
}
