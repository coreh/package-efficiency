import BigNumber from 'bignumber.js'
export const operation = (n) => {
  let r = new BigNumber(1)
  for (let i = 2; i <= n; i++) r = r.times(i)
  return r.toFixed()
}
