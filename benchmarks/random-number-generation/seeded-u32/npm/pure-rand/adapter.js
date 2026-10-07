import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus'
export const operation = ({ seed, count }) => {
  const rng = xoroshiro128plus(seed)
  const out = new Array(count)
  for (let i = 0; i < count; i++) out[i] = rng.next() >>> 0
  return out
}
