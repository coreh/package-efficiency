import { parse } from 'espree'
export const operation = text => parse(text, { ecmaVersion: 2020 })
