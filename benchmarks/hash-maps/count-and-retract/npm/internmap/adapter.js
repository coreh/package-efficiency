import { InternMap } from 'internmap'
const side = (events, drops, weight) => {
  const map = new InternMap()
  for (let i = 0; i < events.length; i++) {
    const k = events[i]
    const c = map.get(k)
    map.set(k, c === undefined ? 1 : c + 1)
  }
  let max = 0, sq = 0, ws = 0
  for (const [k, c] of map) { if (c > max) max = c; sq += c * c; ws += weight(k) * c }
  const distinct = map.size
  for (let i = 0; i < drops.length; i++) {
    const k = drops[i]
    const c = map.get(k)
    if (c === undefined) continue
    if (c === 1) map.delete(k); else map.set(k, c - 1)
  }
  let total = 0
  for (const c of map.values()) total += c
  return [distinct, max, sq, ws, map.size, total]
}
const identity = (k) => k
const length = (k) => k.length
export const operation = ({ ints, strings, intRetracts, stringRetracts }) => {
  const a = side(ints, intRetracts, identity)
  const b = side(strings, stringRetracts, length)
  return [a[0], a[1], a[2], a[3], a[4], a[5], b[0], b[1], b[2], b[3], b[4], b[5]]
}
