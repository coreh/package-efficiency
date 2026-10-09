import colors from 'ansi-colors'
colors.enabled = true
export const operation = ({ style, a, b, c }) => {
  switch (style) {
    case 'red': return colors.red(a)
    case 'green': return colors.green(a)
    case 'bold': return colors.bold(a)
    case 'underline': return colors.underline(a)
    case 'bold-blue': return colors.bold.blue(a)
    case 'red-bold-underline': return colors.red.bold.underline(a)
    case 'bold-in-red': return colors.red(a + colors.bold(b) + c)
    case 'underline-in-green': return colors.green(a + colors.underline(b) + c)
    case 'red-in-bold': return colors.bold(a + colors.red(b) + c)
    case 'deep': return colors.underline(a + colors.bold.red(b) + c)
  }
  throw new Error(`unknown style ${style}`)
}
