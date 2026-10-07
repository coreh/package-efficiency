import { randomIntegerBetween, randomSeeded } from '@std/random'
export const operation = ({ seed, count }) => {
  const prng = randomSeeded(BigInt(seed))
  const options = { prng }
  const out = new Array(count)
  for (let i = 0; i < count; i++) out[i] = randomIntegerBetween(0, 4294967295, options)
  return out
}
