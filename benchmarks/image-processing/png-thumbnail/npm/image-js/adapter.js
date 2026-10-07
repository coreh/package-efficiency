import { Buffer } from 'node:buffer'
import { decode, encode } from 'image-js'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
const format = { format: 'png' }
export const operation = ({ bytes, width, height }) => encode(decode(bytes).resize({ width, height }), format)
