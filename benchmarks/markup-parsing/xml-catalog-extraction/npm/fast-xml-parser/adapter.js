import { XMLParser } from 'fast-xml-parser'
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13 && (c & 0xfc00) !== 0xdc00) n++
  }
  return n
}
// A single child comes back as a value, several as an array.
const list = (x) => x === undefined ? [] : Array.isArray(x) ? x : [x]
// BENCH_FXP=attributes switches attributes on (they are dropped by default).
const options = process.env.BENCH_FXP === 'attributes' ? { ignoreAttributes: false } : undefined
export const operation = (input) => {
  let products = 0, inStock = 0, cents = 0, tags = 0, descriptionChars = 0
  const catalog = new XMLParser(options).parse(input).catalog
  const categories = list(catalog.category)
  for (let i = 0; i < categories.length; i++) {
    const items = list(categories[i].product)
    for (let j = 0; j < items.length; j++) {
      const product = items[j]
      products++
      if (product['@_stock'] === 'true') inStock++
      // Under the default parseTagValue the price text comes back as a number.
      cents += Number(product.price['#text'])
      tags += list(product.tags.tag).length
      descriptionChars += nonSpace(product.description)
    }
  }
  return { products, inStock, cents, tags, descriptionChars }
}
