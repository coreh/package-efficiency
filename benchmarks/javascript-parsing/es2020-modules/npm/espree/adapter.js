import process from 'node:process'
import { parse } from 'espree'
// As installed: no options, which is ecmaVersion 5 and sourceType script. The
// variant sets ecmaVersion 2020 and sourceType: 'module'.
const options = process.env.BENCH_SOURCE_TYPE === 'module' ? { ecmaVersion: 2020, sourceType: 'module' } : undefined
export const operation = text => parse(text, options)
