import { parseSetCookie } from 'cookie'
export const operation = (header) => {
  const c = parseSetCookie(header)
  return {
    name: c.name,
    value: c.value,
    path: c.path ?? null,
    domain: c.domain ?? null,
    maxAge: c.maxAge ?? null,
    secure: c.secure === true,
    httpOnly: c.httpOnly === true,
    sameSite: c.sameSite === undefined ? null : String(c.sameSite).toLowerCase(),
  }
}
