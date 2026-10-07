import { imap, ifilter, itake, reduce } from '@lambdalisue/itertools'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export const operation = ([data, limit]) => reduce(itake(limit, ifilter(imap(data, mapFn), keep)), add, 0)
