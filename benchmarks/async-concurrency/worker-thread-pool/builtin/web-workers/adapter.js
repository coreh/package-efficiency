import { writeFileSync } from 'node:fs'

// The worker module: the task's job, run for each [index, seed, rounds]
// message, answered with [index, value]. It is written beside this file once,
// when the adapter is loaded, outside the measured calls.
const WORKER = new URL('./worker.mjs', import.meta.url)
writeFileSync(WORKER, `const job = (seed, rounds) => {
  let x = seed >>> 0
  for (let r = 0; r < rounds; r++) {
    x = (x ^ (x << 13)) >>> 0
    x = (x ^ (x >>> 17)) >>> 0
    x = (x ^ (x << 5)) >>> 0
  }
  return x
}
self.onmessage = ({ data: [i, seed, rounds] }) => self.postMessage([i, job(seed, rounds)])
`)

// Four Web Workers (the global Worker of Deno and Bun); each is handed the
// next index as soon as it answers, and every result is put at its index.
// The workers are terminated at the end.
export async function operation({ threads, seeds, rounds }) {
  const workers = Array.from({ length: threads }, () => new Worker(WORKER, { type: 'module' }))
  const results = new Array(seeds.length)
  try {
    await new Promise((resolve, reject) => {
      let next = 0, done = 0
      const hand = (worker) => { if (next < seeds.length) { worker.postMessage([next, seeds[next], rounds[next]]); next++ } }
      for (const worker of workers) {
        worker.onerror = (event) => reject(event.error ?? new Error(event.message))
        worker.onmessage = ({ data: [i, value] }) => {
          results[i] = value
          if (++done === seeds.length) resolve()
          else hand(worker)
        }
        hand(worker)
      }
    })
  } finally {
    for (const worker of workers) worker.terminate()
  }
  return results
}
