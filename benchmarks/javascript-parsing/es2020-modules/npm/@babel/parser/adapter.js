import process from 'node:process'
import { parse } from '@babel/parser'
// As installed: default options (sourceType script). The variant sets
// sourceType: 'module'.
const options = process.env.BENCH_SOURCE_TYPE === 'module' ? { sourceType: 'module' } : undefined
export const operation = text => parse(text, options)
