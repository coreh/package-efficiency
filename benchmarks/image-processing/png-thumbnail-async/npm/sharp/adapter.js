import { Buffer } from 'node:buffer'
import sharp from 'sharp'
sharp.cache(false)
sharp.concurrency(1)
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
export const operation = async ({ bytes, width, height }) => await sharp(bytes).resize(width, height).png().toBuffer()
