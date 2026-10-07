import { styleText } from 'node:util'
const o = { validateStream: false }
const red = (s) => styleText('red', s, o), green = (s) => styleText('green', s, o)
const bold = (s) => styleText('bold', s, o), underline = (s) => styleText('underline', s, o)
export const operation = ({ style, a, b, c }) => {
  switch (style) {
    case 'red': return red(a)
    case 'green': return green(a)
    case 'bold': return bold(a)
    case 'underline': return underline(a)
    case 'bold-blue': return styleText(['bold', 'blue'], a, o)
    case 'red-bold-underline': return styleText(['red', 'bold', 'underline'], a, o)
    case 'bold-in-red': return red(a + bold(b) + c)
    case 'underline-in-green': return green(a + underline(b) + c)
    case 'red-in-bold': return bold(a + red(b) + c)
    case 'deep': return underline(a + styleText(['bold', 'red'], b, o) + c)
  }
  throw new Error(`unknown style ${style}`)
}
