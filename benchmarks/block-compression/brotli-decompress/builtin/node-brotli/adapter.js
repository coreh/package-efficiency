import { brotliDecompressSync } from 'node:zlib'
// Not timed: the fixture's binary string becomes bytes once.
export const prepare = (stream) => Buffer.from(stream, 'latin1')
export const operation = (stream) => brotliDecompressSync(stream)
