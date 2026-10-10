import { argon2Sync } from 'node:crypto'
export const prepare = ({ password, salt, memory, passes, parallelism, length }) => ({ password, nonce: Buffer.from(salt, 'hex'), memory, passes, parallelism, length })
export const operation = ({ password, nonce, memory, passes, parallelism, length }) =>
  argon2Sync('argon2id', { message: password, nonce, memory, passes, parallelism, tagLength: length })
