import { AsyncIter } from '@doctor/iterstar'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export async function operation([data, limit]) {
  let pulled = 0
  async function* src() { for (const x of data) { pulled++; yield x } }
  const sum = await new AsyncIter(src()).map(mapFn).filter(keep).slice(0, limit).reduce(add, 0)
  return { sum, pulled }
}
