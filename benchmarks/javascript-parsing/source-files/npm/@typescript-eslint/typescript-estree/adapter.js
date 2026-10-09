import { parse } from '@typescript-eslint/typescript-estree'
export const operation = text => parse(text)
