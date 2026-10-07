const options = { algorithm: 'bcrypt', cost: 8 }
export const operation = ([password, first, second]) => {
  const stored = Bun.password.hashSync(password, options)
  return [Bun.password.verifySync(first, stored), Bun.password.verifySync(second, stored), stored]
}
