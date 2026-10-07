import { parse } from 'parse5'
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
const walk = (node, summary) => {
  if (node.nodeName === '#text') {
    summary.text += nonSpace(node.value)
    return
  }
  if (node.tagName) {
    summary.elements++
    const attrs = node.attrs
    for (let i = 0; i < attrs.length; i++) summary.attributes += codePoints(attrs[i].value)
  }
  const kids = node.childNodes
  if (kids) for (let i = 0; i < kids.length; i++) walk(kids[i], summary)
}
export const operation = (input) => {
  const summary = { elements: 0, attributes: 0, text: 0 }
  walk(parse(input), summary)
  return summary
}
