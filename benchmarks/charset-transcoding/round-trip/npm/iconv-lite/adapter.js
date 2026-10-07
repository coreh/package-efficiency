import iconv from 'iconv-lite'
export const operation = ({ encoding, text }) => {
  const bytes = iconv.encode(text, encoding)
  return [bytes.length, iconv.decode(bytes, encoding)]
}
