import { signJWT, validateJWT } from '@cross/jwt'

export async function prepare({ claims, secret }) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return { claims, key }
}

export async function operation({ claims, key }) {
  const token = await signJWT(claims, key)
  return { claims: await validateJWT(token, key), token }
}
