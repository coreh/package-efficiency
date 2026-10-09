import { Gzip, Gunzip } from 'minizlib'
const encoder = new TextEncoder(), decoder = new TextDecoder()
const pack = (text) => new Gzip().end(encoder.encode(text)).read()
export const operation = (text) => decoder.decode(new Gunzip().end(pack(text)).read() ?? undefined)
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => pack(text).length
