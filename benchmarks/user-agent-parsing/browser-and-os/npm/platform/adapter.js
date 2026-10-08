import platform from 'platform'
export const operation = (ua) => {
  const r = platform.parse(ua)
  return { browser: r.name, version: r.version, os: r.os.family }
}
