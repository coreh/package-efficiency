import iconv from 'iconv-lite'
// Not timed: the fixture's binary string becomes bytes once.
export const prepare = ({ encoding, bytes }) => ({ encoding, bytes: Buffer.from(bytes, 'latin1') })
export const operation = ({ encoding, bytes }) => iconv.decode(bytes, encoding)
