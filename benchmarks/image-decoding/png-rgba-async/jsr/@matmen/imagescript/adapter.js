import { Buffer } from 'node:buffer'
import { Image } from '@matmen/imagescript'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = async (bytes) => {
  const image = await Image.decode(bytes)
  return { width: image.width, height: image.height, data: image.bitmap }
}
