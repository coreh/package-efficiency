import { parse } from 'shell-quote'
export const operation = ({ line }) => parse(line)
