import { parse } from '@libs/xml'
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
// Walks a node's children (text nodes are named ~text, comments ~comment).
const walk = (node, summary) => {
  summary.elements++
  for (const key in node) if (key.charCodeAt(0) === 64) summary.attributes += codePoints(node[key])
  const children = node['~children']
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const name = child['~name']
    if (name === '~text') summary.text += nonSpace(child['#text'])
    else if (name.charCodeAt(0) !== 126) walk(child, summary)
  }
}
export const operation = (input) => {
  const summary = { elements: 0, attributes: 0, text: 0 }
  walk(parse(input, { flatten: { text: false, empty: false } }).html, summary)
  return summary
}
