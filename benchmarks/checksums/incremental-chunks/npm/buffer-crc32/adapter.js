import crc32 from 'buffer-crc32'
export const operation = chunks => {
  let crc = 0
  for (let i = 0; i < chunks.length; i++) crc = crc32.unsigned(chunks[i], crc)
  return crc
}
