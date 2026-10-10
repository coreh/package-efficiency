import { Buffer } from 'node:buffer'
import { decodePNG } from '@img/png'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = async (bytes) => {
  // decodePNG detaches (transfers) the ArrayBuffer of its input and reuses it for the pixels,
  // so each call needs an ArrayBuffer of its own holding just the file.
  const { header, body } = await decodePNG(new Uint8Array(bytes))
  return { width: header.width, height: header.height, data: body }
}
