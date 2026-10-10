import { md5 } from '@takker/md5'
const encoder = new TextEncoder()
export const operation = value => md5(encoder.encode(value))
