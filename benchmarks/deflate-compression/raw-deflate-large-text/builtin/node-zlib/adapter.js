import { deflateRawSync } from 'node:zlib'
export const operation = (text) => deflateRawSync(text)
