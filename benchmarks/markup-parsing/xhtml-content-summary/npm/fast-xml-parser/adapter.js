import { XMLParser } from 'fast-xml-parser'
// Unicode code points in a string: UTF-16 units less the second half of each pair.
const codePoints = (s) => {
  let n = s.length
  for (let i = 0; i < s.length; i++) if ((s.charCodeAt(i) & 0xfc00) === 0xdc00) n--
  return n
}
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13 && (c & 0xfc00) !== 0xdc00) n++
  }
  return n
}
// Text that looks like a number comes back as a number under the default options.
const leaf = (value) => typeof value === 'string' ? nonSpace(value) : String(value).length
const element = (value, summary) => {
  summary.elements++
  if (value !== null && typeof value === 'object') walk(value, summary)
  else summary.text += leaf(value)
}
const walk = (object, summary) => {
  for (const key in object) {
    const child = object[key]
    if (key === '#text') summary.text += leaf(child)
    else if (key.charCodeAt(0) === 64 && key.charCodeAt(1) === 95) summary.attributes += codePoints(child)
    else if (Array.isArray(child)) for (let i = 0; i < child.length; i++) element(child[i], summary)
    else element(child, summary)
  }
}
export const operation = (input) => {
  const summary = { elements: 0, attributes: 0, text: 0 }
  walk(new XMLParser({ ignoreAttributes: false, htmlEntities: true }).parse(input), summary)
  return summary
}
