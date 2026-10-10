import asynckit from 'asynckit'
import { setImmediate } from 'node:timers'

export function operation({ values }) {
  let active = 0, peak = 0
  // Exactly two parameters: asynckit passes (item, cb) to a two-argument iterator.
  const job = (value, cb) => {
    if (++active > peak) peak = active
    setImmediate(() => {
      active--
      cb(null, value * 2 + 1)
    })
  }
  return new Promise((resolve, reject) => {
    asynckit.parallel(values, job, (error, results) => {
      if (error) reject(error)
      else resolve({ results, peak })
    })
  })
}
