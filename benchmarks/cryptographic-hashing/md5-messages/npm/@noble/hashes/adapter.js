import { md5 } from '@noble/hashes/legacy.js'
const encoder = new TextEncoder()
export const operation = value => md5(encoder.encode(value))
