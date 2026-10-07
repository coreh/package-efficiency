import { createHash } from 'node:crypto'
export const operation = value => createHash('sha256').update(value).digest()
