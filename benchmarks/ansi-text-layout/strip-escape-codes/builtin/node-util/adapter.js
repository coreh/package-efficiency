import { stripVTControlCharacters } from 'node:util'
export const operation = (value) => stripVTControlCharacters(value)
