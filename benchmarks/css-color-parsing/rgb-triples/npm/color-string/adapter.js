import colorString from 'color-string'
import convert from 'color-convert'
// color-string parses hex, rgb() and hsl() but only converts to RGB for the
// first two; its documented companion color-convert converts hsl.
export const operation = (text) => {
  const parsed = colorString.get(text)
  return parsed.model === 'rgb' ? parsed.value : convert.hsl.rgb(parsed.value.slice(0, 3))
}
