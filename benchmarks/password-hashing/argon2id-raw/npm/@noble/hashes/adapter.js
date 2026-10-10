import { argon2id } from '@noble/hashes/argon2.js'
export const prepare = ({ password, salt, memory, passes, parallelism, length }) => ({ password, salt: Buffer.from(salt, 'hex'), memory, passes, parallelism, length })
export const operation = ({ password, salt, memory, passes, parallelism, length }) => argon2id(password, salt, { t: passes, m: memory, p: parallelism, dkLen: length })
