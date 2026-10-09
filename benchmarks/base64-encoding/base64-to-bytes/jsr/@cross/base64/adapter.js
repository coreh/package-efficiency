import { toArrayBuffer } from '@cross/base64'
export const operation = value => new Uint8Array(toArrayBuffer(value))
