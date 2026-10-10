import { Buffer } from 'node:buffer'
import sharp from 'sharp'
sharp.cache(false)
sharp.concurrency(1)
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = async (bytes) => {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { width: info.width, height: info.height, data }
}
