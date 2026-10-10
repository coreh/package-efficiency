import { createMutex } from '@117/mutex'
import { setImmediate } from 'node:timers'

const turn = () => new Promise((resolve) => setImmediate(resolve))

export async function operation({ tasks, turns }) {
  const mutex = createMutex()
  let counter = 0
  const run = async () => {
    let mine = 0
    for (let i = 0; i < turns; i++) {
      await mutex.acquire()
      const ticket = counter
      await turn()
      counter = ticket + 1
      mutex.release()
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
