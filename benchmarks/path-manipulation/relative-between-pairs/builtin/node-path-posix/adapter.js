import { posix } from 'node:path'
export const operation = ([from, to]) => posix.relative(from, to)
