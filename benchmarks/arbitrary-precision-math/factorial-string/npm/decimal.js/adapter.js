import Decimal from 'decimal.js'
const D = Decimal.clone({ precision: 3000 })
export const operation = (n) => {
  let r = new D(1)
  for (let i = 2; i <= n; i++) r = r.mul(i)
  return r.toFixed()
}
