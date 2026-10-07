import { Buffer } from 'node:buffer'
import { Transformer } from '@napi-rs/image'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
export const operation = ({ bytes, width, height }) => new Transformer(bytes).resize(width, height).pngSync()
