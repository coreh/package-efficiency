import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus'
import { uniformInt } from 'pure-rand/distribution/uniformInt'
export const operation = ({ seed, count, min, max }) => {
  const rng = xoroshiro128plus(seed)
  const out = new Array(count)
  for (let i = 0; i < count; i++) out[i] = uniformInt(rng, min, max)
  return out
}
