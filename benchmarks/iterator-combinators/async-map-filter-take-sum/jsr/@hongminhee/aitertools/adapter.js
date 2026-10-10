import { map, filter, take, reduce } from '@hongminhee/aitertools'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export async function operation([data, limit]) {
  let pulled = 0
  async function* src() { for (const x of data) { pulled++; yield x } }
  const sum = await reduce(add, take(filter(keep, map(mapFn, src())), limit), 0)
  return { sum, pulled }
}
