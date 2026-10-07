import { Crc32Stream } from '@deno-library/crc32'
const stream = new Crc32Stream()
export const operation = chunks => {
  stream.reset()
  for (let i = 0; i < chunks.length; i++) stream.append(chunks[i])
  return parseInt(stream.crc32 || '0', 16)
}
