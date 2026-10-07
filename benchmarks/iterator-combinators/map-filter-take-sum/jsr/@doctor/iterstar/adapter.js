import { Iter } from '@doctor/iterstar'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export const operation = ([data, limit]) => new Iter(data).map(mapFn).filter(keep).slice(0, limit).reduce(add, 0)
