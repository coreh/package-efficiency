import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'
import { Buffer } from 'node:buffer'
const PKCS8 = Buffer.from('302e020100300506032b657004220420', 'hex')
const SPKI = Buffer.from('302a300506032b6570032100', 'hex')
export const operation = ({ seed, publicKey, message }) => {
  const bytes = Buffer.from(message, 'utf8')
  const priv = createPrivateKey({ key: Buffer.concat([PKCS8, Buffer.from(seed, 'hex')]), format: 'der', type: 'pkcs8' })
  const signature = sign(null, bytes, priv)
  const pub = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(publicKey, 'hex')]), format: 'der', type: 'spki' })
  if (!verify(null, bytes, pub, signature)) throw new Error('signature did not verify')
  return signature
}
