import BigNumber from 'bignumber.js'

export const operation = ({ amounts, rates, block }) => {
  let total = new BigNumber(0)
  const out = ['']
  for (let start = 0; start < amounts.length; start += block) {
    let s = new BigNumber(0)
    for (let i = start; i < start + block; i++) s = s.plus(new BigNumber(amounts[i]).times(new BigNumber(rates[i])))
    out.push(s.decimalPlaces(2, BigNumber.ROUND_HALF_EVEN).toFixed(2))
    total = total.plus(s)
  }
  out[0] = total.decimalPlaces(2, BigNumber.ROUND_HALF_EVEN).toFixed(2)
  return out
}
