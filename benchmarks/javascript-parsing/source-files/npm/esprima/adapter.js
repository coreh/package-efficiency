import { parseScript } from 'esprima'
export const operation = text => parseScript(text)
