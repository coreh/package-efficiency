import pc from 'picocolors'
const { red, green, yellow, blue, bold, dim } = pc.createColors(true)
export const operation = ({ style, a, b, c, d, e }) => {
  switch (style) {
    case 'red-green-twice': return red(a + green(b) + c + green(d) + e)
    case 'blue-yellow': return blue(a + yellow(b) + c)
    case 'bold-dim': return bold(a + dim(b) + c)
    case 'three-level': return red(a + green(b + blue(c) + d) + e)
    case 'bold-red-dim': return bold(a + red(b + dim(c) + d) + e)
  }
  throw new Error(`unknown style ${style}`)
}
