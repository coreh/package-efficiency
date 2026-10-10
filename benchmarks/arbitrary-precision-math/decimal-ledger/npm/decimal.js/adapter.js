import Decimal from 'decimal.js'

// The default precision of 20 significant digits would round the products (up to 27 digits).
const D = Decimal.clone({ precision: 40 })

export const operation = ({ amounts, rates, block }) => {
  let total = new D(0)
  const out = ['']
  for (let start = 0; start < amounts.length; start += block) {
    let s = new D(0)
    for (let i = start; i < start + block; i++) s = s.plus(new D(amounts[i]).times(new D(rates[i])))
    out.push(s.toDecimalPlaces(2, D.ROUND_HALF_EVEN).toFixed(2))
    total = total.plus(s)
  }
  out[0] = total.toDecimalPlaces(2, D.ROUND_HALF_EVEN).toFixed(2)
  return out
}
