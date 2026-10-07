import { parseCookie } from 'cookie'
export const operation = (header) => parseCookie(header)
