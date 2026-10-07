import { map, filter, take, reduce } from '@coven/iterables'
const mapper = map((x) => x * 3 + 1)
const keep = filter((x) => x % 5 !== 0)
const add = (x) => (a) => a + x
export const operation = ([data, limit]) => reduce(add)(0)(take(limit)(keep(mapper(data))))
