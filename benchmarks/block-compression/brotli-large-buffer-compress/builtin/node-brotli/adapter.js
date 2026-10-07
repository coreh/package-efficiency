import { brotliCompressSync, brotliDecompressSync } from 'node:zlib'
export const operation = (text) => brotliCompressSync(text)
// Verifier only (not timed): the matching decompression.
operation.decode = (packed) => brotliDecompressSync(packed).toString('utf8')
