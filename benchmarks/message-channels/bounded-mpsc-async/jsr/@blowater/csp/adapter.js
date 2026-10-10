import { chan } from '@blowater/csp'

export async function operation({ producers, messages, capacity }) {
  const channel = chan(capacity)
  const produce = async (p) => {
    for (let i = 0; i < messages; i++) await channel.put(i * producers + p)
  }
  const running = []
  for (let p = 0; p < producers; p++) running.push(produce(p))
  const following = new Array(producers).fill(0)
  let count = 0, sum = 0, ordered = true
  for (let n = producers * messages; n > 0; n--) {
    const v = await channel.pop()
    const p = v % producers
    if (Math.floor(v / producers) !== following[p]) ordered = false
    following[p]++
    sum += v
    count++
  }
  await Promise.all(running)
  return { count, sum, ordered }
}
