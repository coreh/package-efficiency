import { gzipSync, gunzipSync } from 'node:zlib'
export const operation = (text) => gunzipSync(gzipSync(text)).toString('utf8')
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => gzipSync(text).length
