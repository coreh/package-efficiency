import { strict as assert } from 'node:assert'
// A product catalog as data-oriented XML: an XML declaration, comments,
// single- and double-quoted attributes, predefined entities,
// CDATA sections and non-ASCII text. It is not valid
// HTML (CDATA and the declaration), so only XML parsers are asked. The expected
// figures are summed from the decoded strings as the document is written.
const words = ['Widget', 'Gadget', 'Café table', '日本語 lamp', 'Tom & Jerry mug', 'Chair <deluxe>', 'say "hi" poster', "Chef's knife", 'naïve 😀 toy', 'Desk', 'Notebook']
const snippets = ['Sturdy & light', 'costs < 10 EUR', 'size > medium', 'a "quoted" word', "it's durable", 'café crème', '日本語のテキスト', 'smile 😀 here', 'copyright © 2026', 'dash — dash']
const raw = ['<b>bold</b> & more', '<script>if (a < b && c > d) {}</script>', 'plain CDATA text', '<<>> ]] > &amp; stays']
const tagNames = ['new', 'sale', 'eco', 'gift', 'limited', 'popular']
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// Code points other than space, tab, line feed and carriage return.
const nonSpace = (s) => [...s].filter((c) => c !== ' ' && c !== '\t' && c !== '\n' && c !== '\r').length
const build = (nCategories, perCategory, seed) => {
  const e = { products: 0, inStock: 0, cents: 0, tags: 0, descriptionChars: 0 }
  let k = seed
  const cats = []
  for (let c = 0; c < nCategories; c++) {
    const prods = []
    for (let p = 0; p < perCategory; p++, k++) {
      e.products++
      const inStock = k % 3 !== 0
      if (inStock) e.inStock++
      const cents = 99 + ((k * 7919) % 99900)
      e.cents += cents
      const nTags = 1 + (k % 4)
      e.tags += nTags
      const tags = Array.from({ length: nTags }, (_, j) => `<tag>${tagNames[(k + j) % tagNames.length]}</tag>`).join('')
      // Description: text with entities, then a CDATA section, then more text.
      const a = snippets[k % snippets.length]
      const b = raw[k % raw.length]
      const d = snippets[(k + 3) % snippets.length]
      e.descriptionChars += nonSpace(a) + nonSpace(b) + nonSpace(d)
      const q = k % 2 ? '"' : "'"
      prods.push(`    <product sku=${q}SKU-${String(k).padStart(5, '0')}${q} stock=${q}${inStock}${q}>\n` +
        `      <name>${esc(words[k % words.length])}</name>\n` +
        `      <price currency="EUR">${cents}</price>\n` +
        `      <tags>${tags}</tags>\n` +
        `      <description>${esc(a)} <![CDATA[${b}]]> ${esc(d)}</description>\n` +
        `      <!-- internal note ${k} -->\n` +
        `    </product>`)
    }
    cats.push(`  <category name="Category ${c} &amp; co">\n${prods.join('\n')}\n  </category>`)
  }
  const input = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- generated catalog ${seed} -->\n<catalog version='2' updated="2026-10-06">\n${cats.join('\n')}\n</catalog>\n`
  return { input, expected: e }
}
// 36 documents from one product (about 0.6 KB) to about 120 products (about 40 KB).
export const cases = Array.from({ length: 36 }, (_, i) => {
  const total = 1 + Math.floor((i * i * i) / 400) + i
  const nCategories = 2 + (i % 3)
  const per = Math.max(1, Math.ceil(total / nCategories))
  return build(i < 3 ? 1 : nCategories, i < 3 ? 1 + i : per, i * 13)
})
const fields = ['cents', 'descriptionChars', 'inStock', 'products', 'tags']
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const output = outputs[i]
    assert.ok(output !== null && typeof output === 'object' && !Array.isArray(output), `fixture ${i}: object output required`)
    assert.deepEqual(Object.keys(output).sort(), fields, `fixture ${i}: output must have exactly products, inStock, cents, tags and descriptionChars`)
    for (const field of fields) {
      assert.ok(Number.isInteger(output[field]), `fixture ${i}: integer ${field} required`)
      assert.equal(output[field], expected[field], `fixture ${i}: ${field}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.products + value.inStock + value.cents + value.tags + value.descriptionChars
