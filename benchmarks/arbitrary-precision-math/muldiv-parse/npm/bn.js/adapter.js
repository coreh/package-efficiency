import BN from 'bn.js'
export const operation = ([a, b]) => {
  const x = new BN(a, 10), y = new BN(b, 10)
  const { div, mod } = x.divmod(y)
  return [x.mul(y).toString(10), div.toString(10), mod.toString(10)]
}
