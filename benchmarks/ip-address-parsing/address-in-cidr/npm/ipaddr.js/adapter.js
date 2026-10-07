import ipaddr from 'ipaddr.js'
export const operation = ([address, cidr]) => ipaddr.parse(address).match(ipaddr.parseCIDR(cidr))
