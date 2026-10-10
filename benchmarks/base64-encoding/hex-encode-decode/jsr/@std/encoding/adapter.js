import { encodeHex, decodeHex } from '@std/encoding/hex'
export const prepare = value => Uint8Array.from(value)
export const operation = bytes => {
  const text = encodeHex(bytes)
  return [text, decodeHex(text)]
}
