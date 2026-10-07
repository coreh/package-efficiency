import { gzip, ungzip } from 'pako'
const encoder = new TextEncoder(), decoder = new TextDecoder()
export const operation = (text) => decoder.decode(ungzip(gzip(encoder.encode(text))))
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => gzip(encoder.encode(text)).length
