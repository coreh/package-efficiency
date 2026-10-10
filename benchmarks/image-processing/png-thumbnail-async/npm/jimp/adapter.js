import { Buffer } from 'node:buffer'
import { Jimp } from 'jimp'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
export const operation = async ({ bytes, width, height }) => {
  const image = await Jimp.fromBuffer(bytes)
  image.resize({ w: width, h: height })
  return await image.getBuffer('image/png')
}
