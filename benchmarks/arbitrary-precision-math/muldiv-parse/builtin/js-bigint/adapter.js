export const operation = ([a, b]) => {
  const x = BigInt(a), y = BigInt(b)
  return [(x * y).toString(), (x / y).toString(), (x % y).toString()]
}
