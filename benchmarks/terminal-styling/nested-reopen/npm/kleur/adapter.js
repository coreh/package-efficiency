import kleur from 'kleur'
kleur.enabled = true
export const operation = ({ style, a, b, c, d, e }) => {
  switch (style) {
    case 'red-green-twice': return kleur.red(a + kleur.green(b) + c + kleur.green(d) + e)
    case 'blue-yellow': return kleur.blue(a + kleur.yellow(b) + c)
    case 'bold-dim': return kleur.bold(a + kleur.dim(b) + c)
    case 'three-level': return kleur.red(a + kleur.green(b + kleur.blue(c) + d) + e)
    case 'bold-red-dim': return kleur.bold(a + kleur.red(b + kleur.dim(c) + d) + e)
  }
  throw new Error(`unknown style ${style}`)
}
