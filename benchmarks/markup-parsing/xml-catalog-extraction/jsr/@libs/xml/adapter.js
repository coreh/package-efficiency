import { parse } from '@libs/xml'
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13 && (c & 0xfc00) !== 0xdc00) n++
  }
  return n
}
// The parser groups same-named siblings into an array only when there are several.
const list = (x) => (x === undefined || x === null ? [] : Array.isArray(x) ? x : [x])
// A node holding only text is flattened to a string; otherwise the text is in #text.
const textOf = (node) => (typeof node === 'string' ? node : node['#text'])
export const operation = (input) => {
  let products = 0, inStock = 0, cents = 0, tags = 0, descriptionChars = 0
  const catalog = parse(input, { revive: { entities: false } }).catalog
  for (const category of list(catalog.category)) {
    for (const product of list(category.product)) {
      products++
      if (product['@stock'] === 'true') inStock++
      cents += parseInt(textOf(product.price), 10)
      tags += list(product.tags.tag).length
      descriptionChars += nonSpace(textOf(product.description))
    }
  }
  return { products, inStock, cents, tags, descriptionChars }
}
