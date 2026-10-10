import { map, filter, take, reduce } from '@coven/iterables/async'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (x) => (a) => a + x
export async function operation([data, limit]) {
  let pulled = 0
  async function* src() { for (const x of data) { pulled++; yield x } }
  const sum = await reduce(add)(0)(take(limit)(filter(keep)(map(mapFn)(src()))))
  return { sum, pulled }
}
