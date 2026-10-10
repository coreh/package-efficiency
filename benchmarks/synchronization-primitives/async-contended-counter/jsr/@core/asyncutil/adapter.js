import { Mutex } from '@core/asyncutil'
import { setImmediate } from 'node:timers'

const turn = () => new Promise((resolve) => setImmediate(resolve))

export async function operation({ tasks, turns }) {
  const mutex = new Mutex()
  let counter = 0
  const run = async () => {
    let mine = 0
    for (let i = 0; i < turns; i++) {
      const lock = await mutex.acquire()
      let ticket
      try {
        ticket = counter
        await turn()
        counter = ticket + 1
      } finally {
        lock[Symbol.dispose]()
      }
      mine += ticket
    }
    return mine
  }
  const running = []
  for (let t = 0; t < tasks; t++) running.push(run())
  const sums = await Promise.all(running)
  let sum = 0
  for (const s of sums) sum += s
  return { count: counter, sum }
}
