import { EventEmitter } from 'node:events'
export const operation = ({ names, events }) => {
  const emitter = new EventEmitter()
  let total = 0
  const handlers = names.map((name) => Array.from({ length: 10 }, (_, j) => {
    const handler = (a, b) => { total += a * (j + 1) - b }
    emitter.on(name, handler)
    return handler
  }))
  const half = events.length >> 1
  for (let i = 0; i < half; i++) { const e = events[i]; emitter.emit(e[0], e[1], e[2]) }
  for (let n = 0; n < names.length; n++) { emitter.off(names[n], handlers[n][0]); emitter.off(names[n], handlers[n][5]) }
  for (let i = half; i < events.length; i++) { const e = events[i]; emitter.emit(e[0], e[1], e[2]) }
  return total
}
