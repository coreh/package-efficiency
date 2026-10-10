import async from 'async'
import { setImmediate } from 'node:timers'

// One turn of the event loop: every job is still in flight when the last
// one starts.
const turn = () => new Promise((resolve) => setImmediate(resolve))

export async function operation({ values }) {
  let active = 0, peak = 0
  const tasks = values.map((value) => async () => {
    if (++active > peak) peak = active
    await turn()
    active--
    return value * 2 + 1
  })
  const results = await async.parallel(tasks)
  return { results, peak }
}
