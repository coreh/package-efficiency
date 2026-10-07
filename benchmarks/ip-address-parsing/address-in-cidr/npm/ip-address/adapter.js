import { Address4, Address6 } from 'ip-address'
export const operation = ([address, cidr]) =>
  cidr.includes(':')
    ? new Address6(address).isInSubnet(new Address6(cidr))
    : new Address4(address).isInSubnet(new Address4(cidr))
