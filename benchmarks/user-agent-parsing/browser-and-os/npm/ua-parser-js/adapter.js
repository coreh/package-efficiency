import { UAParser } from 'ua-parser-js'
export const operation = (ua) => {
  const parser = new UAParser(ua)
  const browser = parser.getBrowser()
  return { browser: browser.name, version: browser.major, os: parser.getOS().name }
}
