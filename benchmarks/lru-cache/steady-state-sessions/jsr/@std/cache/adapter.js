import { LruCache } from '@std/cache'
export const operation = ({ capacity, keys }) => {
  const cache = new LruCache(capacity)
  let hits = 0, sum = 0, removed = 0
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (i % 11 === 10) { if (cache.delete(key)) removed++ }
    else {
      const value = cache.get(key)
      if (value !== undefined) { hits++; sum += value }
      else cache.set(key, i)
    }
  }
  return [hits, sum, removed, cache.size]
}
