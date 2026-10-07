import process from 'node:process'
import { parse } from 'jsonc-parser'
// The tuned variant: trailing commas are valid input, not errors to recover from.
const options = process.env.BENCH_JSONC_TRAILING_COMMAS ? { allowTrailingComma: true } : undefined
export const operation = text => parse(text, undefined, options)
