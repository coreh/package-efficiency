import { decodeCbor, encodeCbor } from '@std/cbor'
export const operation = value => decodeCbor(encodeCbor(value))
