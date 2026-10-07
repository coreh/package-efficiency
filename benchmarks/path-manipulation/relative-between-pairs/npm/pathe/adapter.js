import { relative } from 'pathe'
export const operation = ([from, to]) => relative(from, to)
