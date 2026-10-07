import { LRUCache } from 'lru-cache'
export const operation = ({ capacity, keys }) => {
  const cache = new LRUCache({ max: capacity })
  let hits = 0
  for (const key of keys) {
    if (cache.get(key) !== undefined) hits++
    else cache.set(key, 1)
  }
  return hits
}
