import { ResolverFactory } from 'unrs-resolver'

export const operation = ({ base, specifiers }) => {
  const resolver = new ResolverFactory()
  return specifiers.map((s) => resolver.sync(base, s).path)
}
