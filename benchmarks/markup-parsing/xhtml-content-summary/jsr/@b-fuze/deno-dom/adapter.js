import { DOMParser } from '@b-fuze/deno-dom'
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
  if (node.nodeType === 3) {
    summary.text += nonSpace(node.nodeValue)
    return
  }
  if (node.nodeType === 1) {
    summary.elements++
    const attrs = node.attributes
    for (let i = 0; i < attrs.length; i++) summary.attributes += codePoints(attrs[i].value)
  }
  const kids = node.childNodes
  for (let i = 0; i < kids.length; i++) walk(kids[i], summary)
}
export const operation = (input) => {
  const summary = { elements: 0, attributes: 0, text: 0 }
  walk(new DOMParser().parseFromString(input, 'text/html'), summary)
  return summary
}
