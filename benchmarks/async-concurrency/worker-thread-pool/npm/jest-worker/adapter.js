import { writeFileSync } from 'node:fs'
import { Worker } from 'jest-worker'

// The worker module (CommonJS: jest-worker loads it with require), written
// beside this file once when the adapter is loaded, outside the measured calls.
const WORKER = new URL('./worker.cjs', import.meta.url)
writeFileSync(WORKER, `const job = (seed, rounds) => {
  let x = seed >>> 0
  for (let r = 0; r < rounds; r++) {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
  }
  return x
}
exports.job = job
`)

export async function operation({ threads, seeds, rounds }) {
  const worker = new Worker(WORKER.pathname, { numWorkers: threads, enableWorkerThreads: true, exposedMethods: ['job'] })
  try {
    return await Promise.all(seeds.map((seed, i) => worker.job(seed, rounds[i])))
  } finally {
    await worker.end()
  }
}
