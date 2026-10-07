import { base64 } from '@scure/base'
const encoder = new TextEncoder()
export const operation = value => base64.encode(encoder.encode(value))
