import { RealEnvironment, whichSync } from '@david/which'

class PathEnvironment extends RealEnvironment {
  #path
  constructor(path) {
    super()
    this.#path = path
  }
  env(key) {
    return key === 'PATH' ? this.#path : undefined
  }
}

export const operation = ({ path, commands }) => {
  const environment = new PathEnvironment(path)
  return commands.map((name) => whichSync(name, environment) ?? null)
}
