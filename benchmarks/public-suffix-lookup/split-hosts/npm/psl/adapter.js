import psl from 'psl'
export const operation = (host) => {
  const r = psl.parse(host)
  return r.domain === null ? null : [r.subdomain, r.domain, r.tld]
}
