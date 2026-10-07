import { Buffer } from 'node:buffer'
export const operation = value => Buffer.from(value, 'base64')
