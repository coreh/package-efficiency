import { rgb, hsl } from 'd3-color'
export const operation = (c) => {
  const v = hsl(rgb(c[0], c[1], c[2]))
  return [v.h, v.s * 100, v.l * 100]
}
