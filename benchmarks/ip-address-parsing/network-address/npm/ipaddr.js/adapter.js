import ipaddr from 'ipaddr.js'
export const operation = (cidr) =>
  (cidr.includes(':') ? ipaddr.IPv6 : ipaddr.IPv4).networkAddressFromCIDR(cidr).toString()
