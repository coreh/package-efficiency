import { createHash } from 'node:crypto'
export const operation = value => createHash('sha3-256').update(value).digest()
