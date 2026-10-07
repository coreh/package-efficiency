import tr46 from 'tr46'
export const operation = (domain) => {
  const ascii = tr46.toASCII(domain)
  return [ascii, tr46.toUnicode(ascii).domain]
}
