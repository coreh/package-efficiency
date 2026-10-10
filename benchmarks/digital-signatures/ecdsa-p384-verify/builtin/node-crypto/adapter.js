import { createPublicKey, verify } from 'node:crypto'
import { Buffer } from 'node:buffer'
// The SubjectPublicKeyInfo header for an id-ecPublicKey on secp384r1, before the 97-byte SEC1 point.
const SPKI = Buffer.from('3076301006072a8648ce3d020106052b81040022036200', 'hex')
// Untimed, once per fixture: hex becomes bytes and the message its UTF-8 bytes.
export const prepare = ({ publicKey, signature, message }) => ({
  publicKey: Buffer.from(publicKey, 'hex'),
  signature: Buffer.from(signature, 'hex'),
  message: Buffer.from(message, 'utf8'),
})
export const operation = ({ publicKey, signature, message }) => {
  const key = createPublicKey({ key: Buffer.concat([SPKI, publicKey]), format: 'der', type: 'spki' })
  return verify('sha384', message, { key, dsaEncoding: 'ieee-p1363' }, signature)
}
