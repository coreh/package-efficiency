import { parseEnv } from 'node:util'
export const operation = text => parseEnv(text)
