import { randomIntegerBetween, randomSeeded } from '@std/random'
export const operation = ({ seed, count, min, max }) => {
  const options = { prng: randomSeeded(BigInt(seed)) }
  const out = new Array(count)
  for (let i = 0; i < count; i++) out[i] = randomIntegerBetween(min, max, options)
  return out
}
