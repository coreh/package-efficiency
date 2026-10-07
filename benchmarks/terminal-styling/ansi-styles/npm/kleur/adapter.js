import kleur from 'kleur'
kleur.enabled = true
export const operation = ({ style, a, b, c }) => {
  switch (style) {
    case 'red': return kleur.red(a)
    case 'green': return kleur.green(a)
    case 'bold': return kleur.bold(a)
    case 'underline': return kleur.underline(a)
    case 'bold-blue': return kleur.bold().blue(a)
    case 'red-bold-underline': return kleur.red().bold().underline(a)
    case 'bold-in-red': return kleur.red(a + kleur.bold(b) + c)
    case 'underline-in-green': return kleur.green(a + kleur.underline(b) + c)
    case 'red-in-bold': return kleur.bold(a + kleur.red(b) + c)
    case 'deep': return kleur.underline(a + kleur.bold().red(b) + c)
  }
  throw new Error(`unknown style ${style}`)
}
