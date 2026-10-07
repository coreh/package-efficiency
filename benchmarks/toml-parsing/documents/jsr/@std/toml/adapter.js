import { parse } from '@std/toml'
export const operation = text => parse(text)
