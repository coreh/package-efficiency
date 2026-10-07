import { parse } from 'acorn'
export const operation = text => parse(text, { ecmaVersion: 2020 })
