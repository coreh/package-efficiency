import { URL } from 'whatwg-url'
export const operation = ([base, ref]) => new URL(ref, base).href
