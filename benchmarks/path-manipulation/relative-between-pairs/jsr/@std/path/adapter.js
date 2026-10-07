import { relative } from '@std/path/posix'
export const operation = ([from, to]) => relative(from, to)
