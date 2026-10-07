import BigNumber from 'bignumber.js'
export const operation = ([a, b]) => {
  const x = new BigNumber(a), y = new BigNumber(b)
  return [x.times(y).toFixed(), x.idiv(y).toFixed(), x.mod(y).toFixed()]
}
