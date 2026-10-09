import { map } from '@tyler/duckhawk'
import { setImmediate } from 'node:timers'

// One turn of the event loop: the job is still in flight when the limiter
// decides whether to start another.
const turn = () => new Promise((resolve) => setImmediate(resolve))

export async function operation({ values, limit }) {
  let active = 0, peak = 0
  const job = async (value) => {
    if (++active > peak) peak = active
    await turn()
    active--
    return value * 2 + 1
  }
  const results = await map(values, job, { concurrency: limit })
  return { results, peak }
}
