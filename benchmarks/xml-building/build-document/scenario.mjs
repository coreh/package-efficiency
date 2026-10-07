import { strict as assert } from 'node:assert'
// An input is an element tree: { name, attrs: { name: value }, text } for a
// leaf or { name, attrs, children: [...] } for a branch. No element has both
// text and children.
const words = ['Widget', 'Bolt & Nut', 'Tea <green>', 'Cable 3" x 2\'', 'Café crème', '日本語のラベル', 'a > b', ']]> end', '  padded  ', 'Tom & "Jerry"', 'tab\there', 'plain']
const notes = ['in stock', 'ships in 2 & 3 days', 'size "L"', "it's new", '5 < 7', 'ünïcödé', 'two  spaces', 'a=b;c=d']
const pick = (pool, i, k = 0) => pool[(i * 7 + k * 3) % pool.length]
// Attribute values carry no tab or line break: several writers put those in
// literally, and a parser then reads a space (see task.md).
const attr = (pool, i, k = 0) => pick(pool, i, k).replace(/\t/g, ' ')
const leaf = (name, attrs, text) => ({ name, attrs, text })
const item = (seed, i) => {
  const n = seed * 31 + i
  return {
    name: 'item', attrs: { id: String(1000 + n), sku: `SKU-${(n * 7919) % 100000}`, note: pick(notes, n) },
    children: [
      leaf('title', { lang: ['en', 'fr', 'ja'][n % 3], short: attr(words, n, 2), rank: String(n % 9) }, pick(words, n)),
      leaf('price', { currency: ['EUR', 'USD', 'JPY'][n % 3], net: (n * 1.25).toFixed(2), tax: String(n % 4 * 5) }, (n * 1.5 + 0.99).toFixed(2)),
      leaf('description', { format: 'text', length: String(pick(words, n, 1).length * 3), source: pick(notes, n, 1) }, n % 6 === 0 ? '' : `${pick(words, n, 1)} — ${pick(notes, n, 2)}; ${pick(words, n, 3)}`),
      ...(n % 3 === 0 ? [{ name: 'tags', attrs: { count: '2', sorted: 'no', origin: pick(notes, n, 3) }, children: [leaf('tag', { k: 'a', v: '1', w: attr(words, n, 4) }, pick(notes, n, 4)), leaf('tag', { k: 'b', v: '2', w: '' }, pick(words, n, 5))] }] : []),
    ],
  }
}
const sizes = [4, 10, 20, 35, 50, 80, 120, 160, 12, 28, 64, 100]
export const cases = Array.from({ length: 24 }, (_, s) => ({
  input: { name: 'catalog', attrs: { version: '1.0', generated: `2026-10-${String(1 + s).padStart(2, '0')}`, owner: attr(words, s) }, children: Array.from({ length: sizes[s % sizes.length] }, (_, i) => item(s, i)) },
}))

// A small strict XML reader, used only to check outputs. It reads what an XML
// parser would hand to a program: names, attribute values and character data,
// with entities and character references resolved.
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
const unescape = (s, where) => s.replace(/&([^;]*);/g, (m, e) => {
  if (e in entities) return entities[e]
  const code = /^#x[0-9a-fA-F]+$/.test(e) ? parseInt(e.slice(2), 16) : /^#\d+$/.test(e) ? Number(e.slice(1)) : NaN
  assert.ok(!Number.isNaN(code), `unknown entity ${m} in ${where}`)
  return String.fromCodePoint(code)
})
export const readXml = (xml) => {
  let pos = 0
  const fail = (why) => assert.fail(`${why} at offset ${pos}: ${JSON.stringify(xml.slice(pos, pos + 40))}`)
  const skip = (re) => { re.lastIndex = pos; const m = re.exec(xml); if (m) pos = re.lastIndex; return m }
  skip(/﻿?\s*(?:<\?xml[^?]*\?>)?\s*/y)
  const element = () => {
    const open = skip(/<([A-Za-z_][\w.\-:]*)/y) ?? fail('element expected')
    const node = { name: open[1], attrs: {}, text: '', children: [] }
    for (;;) {
      const attr = skip(/\s+([A-Za-z_][\w.\-:]*)\s*=\s*(?:"([^<"]*)"|'([^<']*)')/y)
      if (!attr) break
      assert.ok(!(attr[1] in node.attrs), `attribute ${attr[1]} written twice`)
      // A literal tab or line break in an attribute value reaches a program as a space.
      node.attrs[attr[1]] = unescape((attr[2] ?? attr[3]).replace(/[\t\n\r]/g, ' '), `attribute ${attr[1]}`)
    }
    if (skip(/\s*\/>/y)) return node
    skip(/\s*>/y) ?? fail('end of start tag expected')
    for (;;) {
      if (skip(/<\//y)) {
        const close = skip(/([A-Za-z_][\w.\-:]*)\s*>/y) ?? fail('end tag expected')
        assert.equal(close[1], node.name, `end tag does not match <${node.name}>`)
        return node
      }
      const cdata = skip(/<!\[CDATA\[([\s\S]*?)\]\]>/y)
      if (cdata) { node.text += cdata[1]; continue }
      if (skip(/<!--[\s\S]*?-->/y)) continue
      if (xml[pos] === '<') { node.children.push(element()); continue }
      const text = skip(/[^<]+/y) ?? fail('unexpected end of document')
      assert.ok(!text[0].includes(']]>'), 'a literal ]]> in character data')
      node.text += unescape(text[0].replace(/\r\n?/g, '\n'), 'character data')
    }
  }
  const root = element()
  skip(/\s*/y)
  assert.equal(pos, xml.length, 'content after the root element')
  return root
}
// `path` names the element being compared, for the message.
const same = (got, want, path) => {
  assert.equal(got.name, want.name, `${path}: element name`)
  assert.deepEqual(got.attrs, want.attrs, `${path}: attributes`)
  if (want.children) {
    // White space between child elements is formatting, not content.
    assert.equal(got.text.trim(), '', `${path}: text where only child elements belong`)
    assert.equal(got.children.length, want.children.length, `${path}: number of child elements`)
    want.children.forEach((child, i) => same(got.children[i], child, `${path}/${child.name}[${i}]`))
  } else {
    assert.equal(got.children.length, 0, `${path}: child elements in a text element`)
    assert.equal(got.text, want.text, `${path}: text`)
  }
}
export const verifyOne = (i, xml) => {
  assert.equal(typeof xml, 'string', `fixture ${i}: a string is required`)
  same(readXml(xml), cases[i].input, `fixture ${i}: /${cases[i].input.name}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
