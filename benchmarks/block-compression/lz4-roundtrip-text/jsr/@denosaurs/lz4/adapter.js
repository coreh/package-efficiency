import { compress, decompress } from '@denosaurs/lz4'
const encoder = new TextEncoder(), decoder = new TextDecoder()
export const operation = (text) => decoder.decode(decompress(compress(encoder.encode(text))))
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => compress(encoder.encode(text)).length
