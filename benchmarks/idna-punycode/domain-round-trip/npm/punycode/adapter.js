import punycode from 'punycode'
export const operation = (domain) => {
  const ascii = punycode.toASCII(domain)
  return [ascii, punycode.toUnicode(ascii)]
}
