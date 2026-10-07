import { fromByteArray } from 'base64-js'
const encoder = new TextEncoder()
export const operation = value => fromByteArray(encoder.encode(value))
