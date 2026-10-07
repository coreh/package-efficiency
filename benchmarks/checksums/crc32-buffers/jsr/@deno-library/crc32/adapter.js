import { crc32 } from '@deno-library/crc32'
export const operation = value => parseInt(crc32(value), 16)
