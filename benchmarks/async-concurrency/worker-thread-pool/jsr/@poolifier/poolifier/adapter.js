import { writeFileSync } from 'node:fs'
import { FixedThreadPool } from '@poolifier/poolifier'

// The worker module, written beside this file once when the adapter is
// loaded, outside the measured calls.
const WORKER = new URL('./worker.mjs', import.meta.url)
writeFileSync(WORKER, `import { ThreadWorker } from '@poolifier/poolifier'
const job = (seed, rounds) => {
  let x = seed >>> 0
  for (let r = 0; r < rounds; r++) {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
  }
  return x
}
export default new ThreadWorker(({ seed, rounds }) => job(seed, rounds))
`)

export async function operation({ threads, seeds, rounds }) {
  const pool = new FixedThreadPool(threads, WORKER.pathname)
  try {
    return await Promise.all(seeds.map((seed, i) => pool.execute({ seed, rounds: rounds[i] })))
  } finally {
    await pool.destroy()
  }
}
