import { brotliCompressSync, brotliDecompressSync } from 'node:zlib'
export const operation = (text) => brotliDecompressSync(brotliCompressSync(text)).toString('utf8')
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => brotliCompressSync(text).length
