import { IoCContainer } from '@fathym/ioc'
export const operation = ({ root, services }) => {
  const ioc = new IoCContainer()
  for (const { id, deps } of services) {
    ioc.Register((c) => ({ id, deps: deps.map((d) => c.ResolveDirect(c.Symbol(d))) }), { Type: ioc.Symbol(id) })
  }
  return ioc.ResolveDirect(ioc.Symbol(root))
}
