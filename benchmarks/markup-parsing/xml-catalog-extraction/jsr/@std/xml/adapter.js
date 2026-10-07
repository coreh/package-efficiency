import { parse } from '@std/xml'
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13 && (c & 0xfc00) !== 0xdc00) n++
  }
  return n
}
// Concatenated text of an element's text and CDATA children.
const textOf = (element, counter) => {
  const kids = element.children
  let s = ''
  for (let i = 0; i < kids.length; i++) {
    const kid = kids[i]
    if (kid.type === 'text' || kid.type === 'cdata') s += kid.text
  }
  return s
}
const elementsOf = (element, name) => element.children.filter((c) => c.type === 'element' && c.name.local === name)
export const operation = (input) => {
  let products = 0, inStock = 0, cents = 0, tags = 0, descriptionChars = 0
  const catalog = parse(input).root
  for (const category of elementsOf(catalog, 'category')) {
    for (const product of elementsOf(category, 'product')) {
      products++
      if (product.attributes.stock === 'true') inStock++
      cents += parseInt(textOf(elementsOf(product, 'price')[0]), 10)
      tags += elementsOf(elementsOf(product, 'tags')[0], 'tag').length
      descriptionChars += nonSpace(textOf(elementsOf(product, 'description')[0]))
    }
  }
  return { products, inStock, cents, tags, descriptionChars }
}
