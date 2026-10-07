import { Decimal } from '@quentinadam/decimal'
export const operation = (n) => {
  let r = Decimal.from(1)
  for (let i = 2; i <= n; i++) r = r.mul(i)
  return r.toString()
}
