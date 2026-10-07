import { SaxesParser } from 'saxes'
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
  let products = 0, inStock = 0, cents = 0, tags = 0, descriptionChars = 0
  // Which of price or description we are inside; neither contains elements.
  let inside = 0, priceText = ''
  const open = (name, attrs) => {
    if (name === 'product') {
      products++
      if (attrs.stock === 'true') inStock++
    } else if (name === 'tag') tags++
    else if (name === 'price') { inside = 1; priceText = '' }
    else if (name === 'description') inside = 2
  }
  const close = (name) => {
    if (name === 'price') cents += parseInt(priceText, 10)
    if (name === 'price' || name === 'description') inside = 0
  }
  const text = (data) => {
    if (inside === 1) priceText += data
    else if (inside === 2) descriptionChars += nonSpace(data)
  }
  const parser = new SaxesParser()
  parser.on('opentag', (node) => open(node.name, node.attributes))
  parser.on('closetag', (node) => close(node.name))
  parser.on('text', text)
  parser.on('cdata', text)
  parser.write(input).close()
  return { products, inStock, cents, tags, descriptionChars }
}
