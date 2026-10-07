import { Cookie } from 'tough-cookie'
export const operation = (header) => {
  const c = Cookie.parse(header)
  return {
    name: c.key,
    value: c.value,
    path: c.path ?? null,
    domain: c.domain ?? null,
    maxAge: typeof c.maxAge === 'number' ? c.maxAge : null,
    secure: c.secure === true,
    httpOnly: c.httpOnly === true,
    sameSite: c.sameSite === undefined ? null : String(c.sameSite).toLowerCase(),
  }
}
