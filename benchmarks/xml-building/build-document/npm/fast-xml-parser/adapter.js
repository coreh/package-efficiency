import process from 'node:process'
import { XMLBuilder } from 'fast-xml-parser'
// As installed, XMLBuilder ignores attributes. The variant passes { ignoreAttributes: false }.
const builder = process.env.BENCH_FXP === 'attributes' ? new XMLBuilder({ ignoreAttributes: false }) : new XMLBuilder()
// The package takes nested data: attributes as '@_name' keys, text as '#text',
// child elements under their name, repeated names as an array.
const shape = (node) => {
  const out = {}
  for (const name in node.attrs) out['@_' + name] = node.attrs[name]
  if (node.children) {
    for (const child of node.children) {
      const value = shape(child)
      if (out[child.name] === undefined) out[child.name] = value
      else if (Array.isArray(out[child.name])) out[child.name].push(value)
      else out[child.name] = [out[child.name], value]
    }
  } else out['#text'] = node.text
  return out
}
export const operation = (doc) => builder.build({ [doc.name]: shape(doc) })
