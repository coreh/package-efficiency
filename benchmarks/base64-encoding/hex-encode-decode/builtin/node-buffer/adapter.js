import { Buffer } from 'node:buffer'
// Untimed, once per fixture: the list of byte values becomes a Buffer.
export const prepare = value => Buffer.from(value)
export const operation = value => {
  const text = value.toString('hex')
  return [text, Buffer.from(text, 'hex')]
}
