import { Container } from '@needle-di/core'
export const operation = ({ root, services }) => {
  const container = new Container()
  for (const { id, deps } of services) {
    container.bind({ provide: id, useFactory: (c) => ({ id, deps: deps.map((d) => c.get(d)) }) })
  }
  return container.get(root)
}
