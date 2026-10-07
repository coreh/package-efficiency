import { setColorEnabled, red, green, blue, bold, underline } from '@std/fmt/colors'
setColorEnabled(true)
export const operation = ({ style, a, b, c }) => {
  switch (style) {
    case 'red': return red(a)
    case 'green': return green(a)
    case 'bold': return bold(a)
    case 'underline': return underline(a)
    case 'bold-blue': return bold(blue(a))
    case 'red-bold-underline': return red(bold(underline(a)))
    case 'bold-in-red': return red(a + bold(b) + c)
    case 'underline-in-green': return green(a + underline(b) + c)
    case 'red-in-bold': return bold(a + red(b) + c)
    case 'deep': return underline(a + bold(red(b)) + c)
  }
  throw new Error(`unknown style ${style}`)
}
