import colors from 'ansi-colors'
colors.enabled = true
export const operation = ({ style, a, b, c, d, e }) => {
  switch (style) {
    case 'red-green-twice': return colors.red(a + colors.green(b) + c + colors.green(d) + e)
    case 'blue-yellow': return colors.blue(a + colors.yellow(b) + c)
    case 'bold-dim': return colors.bold(a + colors.dim(b) + c)
    case 'three-level': return colors.red(a + colors.green(b + colors.blue(c) + d) + e)
    case 'bold-red-dim': return colors.bold(a + colors.red(b + colors.dim(c) + d) + e)
  }
  throw new Error(`unknown style ${style}`)
}
