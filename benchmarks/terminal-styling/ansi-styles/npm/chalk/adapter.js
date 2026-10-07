import { Chalk } from 'chalk'
const chalk = new Chalk({ level: 1 })
export const operation = ({ style, a, b, c }) => {
  switch (style) {
    case 'red': return chalk.red(a)
    case 'green': return chalk.green(a)
    case 'bold': return chalk.bold(a)
    case 'underline': return chalk.underline(a)
    case 'bold-blue': return chalk.bold.blue(a)
    case 'red-bold-underline': return chalk.red.bold.underline(a)
    case 'bold-in-red': return chalk.red(a + chalk.bold(b) + c)
    case 'underline-in-green': return chalk.green(a + chalk.underline(b) + c)
    case 'red-in-bold': return chalk.bold(a + chalk.red(b) + c)
    case 'deep': return chalk.underline(a + chalk.bold.red(b) + c)
  }
  throw new Error(`unknown style ${style}`)
}
