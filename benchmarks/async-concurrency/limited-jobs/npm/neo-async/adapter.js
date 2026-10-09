import async from 'neo-async'
import { setImmediate } from 'node:timers'

export function operation({ values, limit }) {
  let active = 0, peak = 0
  // The job counts in, yields one turn of the event loop, counts out.
  const job = (value, done) => {
    if (++active > peak) peak = active
    setImmediate(() => {
      active--
      done(null, value * 2 + 1)
    })
  }
  return new Promise((resolve, reject) => {
    async.mapLimit(values, limit, job, (error, results) => {
      if (error) reject(error)
      else resolve({ results, peak })
    })
  })
}
