import Decimal from 'decimal.js'
const D = Decimal.clone({ precision: 5000 })
export const operation = ([a, b]) => {
  const x = new D(a), y = new D(b)
  return [x.mul(y).toFixed(), x.divToInt(y).toFixed(), x.mod(y).toFixed()]
}
