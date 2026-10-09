import { createQueue } from '@sv2dev/tasque'
import { setImmediate } from 'node:timers'

// One turn of the event loop: the job is still in flight when the limiter
// decides whether to start another.
const turn = () => new Promise((resolve) => setImmediate(resolve))

export async function operation({ values, limit }) {
  const queue = createQueue({ parallelize: limit })
  let active = 0, peak = 0
  const job = async (value) => {
    if (++active > peak) peak = active
    await turn()
    active--
    return value * 2 + 1
  }
  const results = await Promise.all(values.map((value) => queue.add(() => job(value))))
  return { results, peak }
}
