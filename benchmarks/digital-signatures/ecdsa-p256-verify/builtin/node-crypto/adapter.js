import { createPublicKey, verify } from 'node:crypto'
import { Buffer } from 'node:buffer'
const SPKI = Buffer.from('3059301306072a8648ce3d020106082a8648ce3d030107034200', 'hex')
export const operation = ({ publicKey, signature, message }) => {
  const key = createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(publicKey, 'hex')]), format: 'der', type: 'spki' })
  return verify('sha256', Buffer.from(message, 'utf8'), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature, 'hex'))
}
