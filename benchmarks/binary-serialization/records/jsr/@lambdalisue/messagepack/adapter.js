import { decode, encode } from '@lambdalisue/messagepack'
export const operation = value => decode(encode(value))
