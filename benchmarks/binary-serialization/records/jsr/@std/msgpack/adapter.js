import { decode, encode } from '@std/msgpack'
export const operation = value => decode(encode(value))
