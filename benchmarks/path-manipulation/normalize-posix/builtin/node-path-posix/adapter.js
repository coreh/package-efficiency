import { posix } from 'node:path'
export const operation = value => posix.normalize(value)
