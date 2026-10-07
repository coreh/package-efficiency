import process from 'node:process'
import { parse } from '@adobe/css-tools'
// As installed: parse(css) throws on the first mistake. The variant passes
// { silent: true }.
const silent = { silent: true }
export const operation = process.env.BENCH_CSS_TOOLS === 'silent' ? css => parse(css, silent) : css => parse(css)
