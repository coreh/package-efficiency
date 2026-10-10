import { Buffer } from 'node:buffer'
import { Image } from '@matmen/imagescript'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
export const operation = async ({ bytes, width, height }) => {
  const image = await Image.decode(bytes)
  image.resize(width, height)
  return await image.encode()
}
