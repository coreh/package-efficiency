import parallel from 'run-parallel'
import { setImmediate } from 'node:timers'

export function operation({ values }) {
  let active = 0, peak = 0
  // One task per value: count in, yield one turn of the event loop, count out.
  const tasks = values.map((value) => (cb) => {
    if (++active > peak) peak = active
    setImmediate(() => {
      active--
      cb(null, value * 2 + 1)
    })
  })
  return new Promise((resolve, reject) => {
    parallel(tasks, (error, results) => {
      if (error) reject(error)
      else resolve({ results, peak })
    })
  })
}
