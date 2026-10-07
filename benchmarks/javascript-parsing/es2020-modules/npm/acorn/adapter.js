import process from 'node:process'
import { parse } from 'acorn'
// acorn 8 requires ecmaVersion (it has no default), so 2020 is named; the
// sourceType is the default (script). The variant sets sourceType: 'module'.
const options = process.env.BENCH_SOURCE_TYPE === 'module' ? { ecmaVersion: 2020, sourceType: 'module' } : { ecmaVersion: 2020 }
export const operation = text => parse(text, options)
