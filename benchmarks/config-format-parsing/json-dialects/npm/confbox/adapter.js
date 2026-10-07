import process from 'node:process'
import { parseJSONC, parseJSON5 } from 'confbox'
// As installed: parseJSONC with default options. The variants: parseJSONC with
// trailing commas allowed, and the package's JSON5 entry point.
const mode = process.env.BENCH_CONFBOX
const options = { allowTrailingComma: true }
export const operation = mode === 'json5' ? text => parseJSON5(text)
  : mode === 'trailing-commas' ? text => parseJSONC(text, options)
  : text => parseJSONC(text)
