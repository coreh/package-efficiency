import { setImmediate } from 'node:timers'
const turn = () => new Promise((resolve) => setImmediate(resolve))
export async function operation({ tasks, multiplier, offset, modulus }) {
  // Calling an async function starts it at once: that is JavaScript's spawn,
  // and its promise is the handle.
  const task = async (i) => {
    await turn()
    return (i * multiplier + offset) % modulus
  }
  const handles = new Array(tasks)
  for (let i = 0; i < tasks; i++) handles[i] = task(i)
  const values = await Promise.all(handles)
  let total = 0
  for (let i = 0; i < tasks; i++) total += values[i]
  return total
}
