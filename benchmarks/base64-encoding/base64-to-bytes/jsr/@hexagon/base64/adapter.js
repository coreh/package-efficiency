import { base64 } from '@hexagon/base64'
export const operation = value => new Uint8Array(base64.toArrayBuffer(value))
