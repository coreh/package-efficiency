import { EventEmitter } from 'node:events'
export const operation = ({ names, events }) => {
  const emitter = new EventEmitter()
  let total = 0
  const arm = (once) => {
    for (let n = 0; n < names.length; n++) {
      const name = names[n]
      for (let j = 0; j < 6; j++) {
        if ((j & 1) === 1 !== once) continue
        const handler = (a, b) => { total += a * (j + 1) - b }
        if (once) emitter.once(name, handler)
        else emitter.on(name, handler)
      }
    }
  }
  arm(false)
  arm(true)
  const half = events.length >> 1
  for (let i = 0; i < half; i++) { const e = events[i]; emitter.emit(e[0], e[1], e[2]) }
  arm(true)
  for (let i = half; i < events.length; i++) { const e = events[i]; emitter.emit(e[0], e[1], e[2]) }
  return total
}
