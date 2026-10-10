import { map } from '@core/iterutil/async/map'
import { filter } from '@core/iterutil/async/filter'
import { take } from '@core/iterutil/async/take'
import { reduce } from '@core/iterutil/async/reduce'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export async function operation([data, limit]) {
  let pulled = 0
  async function* src() { for (const x of data) { pulled++; yield x } }
  const sum = await reduce(take(filter(map(src(), mapFn), keep), limit), add, 0)
  return { sum, pulled }
}
