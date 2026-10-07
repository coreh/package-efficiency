import { Address4, Address6 } from 'ip-address'
export const operation = (cidr) =>
  cidr.includes(':') ? new Address6(cidr).startAddress().correctForm() : new Address4(cidr).startAddress().correctForm()
