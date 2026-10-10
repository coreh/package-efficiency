import { SignJWT, jwtVerify } from '@panva/jose'

export async function prepare({ claims, secret }) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return { claims, key }
}

export async function operation({ claims, key }) {
  const token = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256' }).sign(key)
  return { claims: (await jwtVerify(token, key)).payload, token }
}
