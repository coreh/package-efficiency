import { parse } from 'dotenv'
import { expand } from 'dotenv-expand'
export const operation = text => expand({ parsed: parse(text), processEnv: {} }).parsed
