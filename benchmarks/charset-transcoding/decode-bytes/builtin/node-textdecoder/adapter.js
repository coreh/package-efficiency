// Not timed: the fixture's binary string becomes bytes once.
export const prepare = ({ encoding, bytes }) => ({ encoding, bytes: Buffer.from(bytes, 'latin1') })
// One decoder per encoding name, kept across calls as a program would keep it.
const decoders = new Map()
export const operation = ({ encoding, bytes }) => {
  let decoder = decoders.get(encoding)
  if (!decoder) decoders.set(encoding, decoder = new TextDecoder(encoding))
  return decoder.decode(bytes)
}
