import * as ed from '@noble/ed25519'
import { sha512 } from '@noble/hashes/sha2.js'
ed.hashes.sha512 = sha512
import { Buffer } from 'node:buffer'
const encoder = new TextEncoder()
const fromHex = Uint8Array.fromHex ? (hex) => Uint8Array.fromHex(hex) : (hex) => Buffer.from(hex, 'hex')
export const operation = ({ seed, publicKey, message }) => {
  const bytes = encoder.encode(message)
  const signature = ed.sign(bytes, fromHex(seed))
  if (!ed.verify(signature, bytes, fromHex(publicKey))) throw new Error('signature did not verify')
  return signature
}
