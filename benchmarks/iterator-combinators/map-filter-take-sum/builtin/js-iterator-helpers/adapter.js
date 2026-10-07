const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export const operation = ([data, limit]) => data.values().map(mapFn).filter(keep).take(limit).reduce(add, 0)
