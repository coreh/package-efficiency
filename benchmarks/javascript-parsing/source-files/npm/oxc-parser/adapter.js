import { parseSync } from 'oxc-parser'
export const operation = text => parseSync('source.js', text)
