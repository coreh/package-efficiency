import { Buffer } from 'node:buffer'
export const operation = value => Buffer.from(value, 'utf8').toString('base64')
