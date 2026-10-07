import { map } from '@core/iterutil/map'
import { filter } from '@core/iterutil/filter'
import { take } from '@core/iterutil/take'
import { reduce } from '@core/iterutil/reduce'
const mapFn = (x) => x * 3 + 1
const keep = (x) => x % 5 !== 0
const add = (a, x) => a + x
export const operation = ([data, limit]) => reduce(take(filter(map(data, mapFn), keep), limit), add, 0)
