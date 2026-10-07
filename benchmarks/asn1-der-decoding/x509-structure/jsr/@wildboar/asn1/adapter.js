import { Buffer } from 'node:buffer'
import { DERElement } from '@wildboar/asn1'
const walk = (el, out) => {
  out.push(el.tagClass * 100 + el.tagNumber)
  if (el.construction === 1) for (const child of el.components) walk(child, out)
  return out
}
// Not timed: runs once per fixture.
export const prepare = (hex) => Buffer.from(hex, 'hex')
export const operation = (bytes) => {
  const el = new DERElement()
  el.fromBytes(bytes)
  return walk(el, [])
}
