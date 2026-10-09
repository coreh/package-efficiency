import { color, serializeRGB } from '@csstools/css-color-parser'
import { parseComponentValue, isTokenNode } from '@csstools/css-parser-algorithms'
import { tokenize } from '@csstools/css-tokenizer'
// The package has no sRGB-channels accessor for hsl(): serializeRGB converts any parsed
// color to an rgb() function node, whose numeric tokens are the channels.
export const operation = (text) => {
  const node = serializeRGB(color(parseComponentValue(tokenize({ css: text }))))
  const out = []
  for (const n of node.value) if (isTokenNode(n) && n.value[0] === 'number-token') out.push(n.value[4].value)
  return out
}
