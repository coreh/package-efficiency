import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate'
export const operation = (text) => strFromU8(gunzipSync(gzipSync(strToU8(text))))
// Verifier only (not timed): the size of what the same compression call produces.
operation.compressedBytes = (text) => gzipSync(strToU8(text)).length
