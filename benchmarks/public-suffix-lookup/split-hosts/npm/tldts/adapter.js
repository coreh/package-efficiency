import { parse } from 'tldts'
export const operation = (host) => {
  const r = parse(host)
  return r.domain === null ? null : [r.subdomain, r.domain, r.publicSuffix]
}
