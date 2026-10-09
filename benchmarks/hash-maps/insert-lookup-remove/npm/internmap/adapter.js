import { InternMap } from 'internmap'

const side = (keys, probes, weight) => {
  const map = new InternMap()
  for (let i = 0; i < keys.length; i++) map.set(keys[i], i)
  const size = map.size
  let hits = 0, found = 0
  for (let i = 0; i < probes.length; i++) {
    const v = map.get(probes[i])
    if (v !== undefined) { hits++; found += v }
  }
  let ksum = 0, vsum = 0
  for (const [k, v] of map) { ksum += weight(k); vsum += v }
  for (let i = 0; i < keys.length; i += 2) map.delete(keys[i])
  const count = map.size
  let left = 0
  for (let i = 0; i < probes.length; i++) if (map.has(probes[i])) left++
  return [size, hits, found, ksum, vsum, count, left]
}
const identity = (k) => k
const length = (k) => k.length
export const operation = ({ ints, intProbes, strings, stringProbes }) => {
  const a = side(ints, intProbes, identity)
  const b = side(strings, stringProbes, length)
  return [a[0], a[1], a[2], a[3], a[4], a[5], a[6], b[0], b[1], b[2], b[3], b[4], b[5], b[6]]
}
