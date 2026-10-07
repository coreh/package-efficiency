import { compress, decompress } from '@nick/lz4'
const encoder = new TextEncoder(), decoder = new TextDecoder()
export const operation = (text) => compress(encoder.encode(text))
// Verifier only (not timed): the matching decompression.
operation.decode = (packed) => decoder.decode(decompress(packed))
