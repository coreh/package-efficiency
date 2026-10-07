import { resolve } from 'uri-js'
export const operation = ([base, ref]) => resolve(base, ref)
