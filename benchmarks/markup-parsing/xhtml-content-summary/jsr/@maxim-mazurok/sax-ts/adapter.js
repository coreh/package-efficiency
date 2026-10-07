import { SAXParser } from '@maxim-mazurok/sax-ts'
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
export const operation = (input) => {
  let elements = 0, attributes = 0, text = 0
  const parser = new SAXParser(true, {})
  parser.onopentag = (node) => {
    elements++
    for (const key in node.attributes) attributes += codePoints(node.attributes[key])
  }
  parser.ontext = (data) => { text += nonSpace(data) }
  parser.write(input).close()
  return { elements, attributes, text }
}
