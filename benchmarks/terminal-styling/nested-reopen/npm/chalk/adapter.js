import { Chalk } from 'chalk'
const chalk = new Chalk({ level: 1 })
export const operation = ({ style, a, b, c, d, e }) => {
  switch (style) {
    case 'red-green-twice': return chalk.red(a + chalk.green(b) + c + chalk.green(d) + e)
    case 'blue-yellow': return chalk.blue(a + chalk.yellow(b) + c)
    case 'bold-dim': return chalk.bold(a + chalk.dim(b) + c)
    case 'three-level': return chalk.red(a + chalk.green(b + chalk.blue(c) + d) + e)
    case 'bold-red-dim': return chalk.bold(a + chalk.red(b + chalk.dim(c) + d) + e)
  }
  throw new Error(`unknown style ${style}`)
}
