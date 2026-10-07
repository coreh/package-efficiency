export const operation = (n) => {
  const last = BigInt(n)
  let r = 1n
  for (let i = 2n; i <= last; i++) r *= i
  return r.toString()
}
