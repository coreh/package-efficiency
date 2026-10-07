import { crc32 } from 'node:zlib'
export const operation = value => crc32(value)
