import { parse } from '@std/xml'
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
const walk = (element, summary) => {
  summary.elements++
  const attrs = element.attributes
  for (const key in attrs) summary.attributes += codePoints(attrs[key])
  const children = element.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === 'element') walk(child, summary)
    else if (child.type === 'text') summary.text += nonSpace(child.text)
  }
}
export const operation = (input) => {
  const summary = { elements: 0, attributes: 0, text: 0 }
  walk(parse(input).root, summary)
  return summary
}
