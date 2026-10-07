import Fraction from 'fraction.js'
export const operation = (n) => {
  let r = new Fraction(1)
  for (let i = 2; i <= n; i++) r = r.mul(i)
  return r.toFraction()
}
