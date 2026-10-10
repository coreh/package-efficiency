// Untimed, once per fixture: the list of byte values becomes a Uint8Array.
export const prepare = value => Uint8Array.from(value)
export const operation = value => {
  const text = value.toHex()
  return [text, Uint8Array.fromHex(text)]
}
