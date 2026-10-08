import Bowser from 'bowser'
export const operation = (ua) => {
  const r = Bowser.parse(ua)
  return { browser: r.browser.name, version: r.browser.version, os: r.os.name }
}
