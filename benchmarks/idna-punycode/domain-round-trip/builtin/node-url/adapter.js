import { domainToASCII, domainToUnicode } from 'node:url'
export const operation = (domain) => {
  const ascii = domainToASCII(domain)
  return [ascii, domainToUnicode(ascii)]
}
