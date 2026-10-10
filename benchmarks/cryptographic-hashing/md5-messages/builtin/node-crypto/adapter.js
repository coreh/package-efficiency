import { createHash } from 'node:crypto'
export const operation = value => createHash('md5').update(value).digest()
