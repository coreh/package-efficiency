import { createRequire } from 'node:module'

export const operation = ({ base, specifiers }) => {
  const req = createRequire(base + '/')
  return specifiers.map((s) => req.resolve(s))
}
