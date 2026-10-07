import { crc32 } from 'node:zlib'
export const operation = chunks => {
  let crc = 0
  for (let i = 0; i < chunks.length; i++) crc = crc32(chunks[i], crc)
  return crc
}
