import crc32 from 'buffer-crc32'
export const operation = value => crc32.unsigned(value)
