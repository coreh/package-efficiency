import { detect } from 'detect-browser'
export const operation = (ua) => {
  const r = detect(ua)
  return { browser: r.name, version: r.version, os: r.os }
}
