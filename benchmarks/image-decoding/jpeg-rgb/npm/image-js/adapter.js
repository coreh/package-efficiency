import { Buffer } from 'node:buffer'
import { decode } from 'image-js'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => {
  const image = decode(bytes)
  return { width: image.width, height: image.height, data: image.getRawImage().data }
}
