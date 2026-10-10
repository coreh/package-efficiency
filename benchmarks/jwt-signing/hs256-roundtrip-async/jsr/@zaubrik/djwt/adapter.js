import { create, verify } from '@zaubrik/djwt'

export async function prepare({ claims, secret }) {
  const key = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return { claims, key }
}

export async function operation({ claims, key }) {
  const token = await create({ alg: 'HS256', typ: 'JWT' }, claims, key)
  return { claims: await verify(token, key), token }
}
