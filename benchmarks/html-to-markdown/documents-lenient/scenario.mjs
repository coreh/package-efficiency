import { strict as assert } from 'node:assert'
// The lenient task of html-to-markdown/documents: the same HTML fragments and
// the same Markdown reader, taken from the strict scenario. The structure is
// compared as there; white space inside an inline element, and between an
// inline element and what is next to it, is not compared.
import { cases as strictCases, readMarkdown, verifyOne as strictVerifyOne, consume as strictConsume } from '../documents/scenario.mjs'

export const cases = strictCases.map(({ input }) => ({ input }))

// --- What each fragment holds -------------------------------------------------
// The strict scenario keeps what its generator recorded to itself, and that
// record has the text of a block without the places of its inline elements.
// So the fragments are read here: they are generated HTML of one regular
// shape (article > p, h1 to h6, ul, ol, li, pre > code; strong, em, i, code
// and a inside p and li), and this reader accepts nothing else. Below, every
// reading is checked against the strict task's own check.
const unescapeHtml = (s) => s.replace(/&(amp|lt|gt|quot);/g, (_, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"' })[name])
const collapse = (s) => s.replace(/\s+/g, ' ').trim()
const INLINE = { strong: 'strong', em: 'em', i: 'em', code: 'code', a: 'link' }
const readHtml = (html) => {
  const blocks = []
  const lists = []
  let block = null
  let element = null
  const flush = () => { if (block) { blocks.push(block); block = null } }
  for (const m of html.matchAll(/<pre><code[^>]*>([^<]*)<\/code><\/pre>|<(\/?)([a-z][a-z0-9]*)((?:\s+[a-z]+="[^"]*")*)>|([^<]+)/g)) {
    const [, code, closing, tag, attrs, text] = m
    if (code !== undefined) { assert.equal(block, null); blocks.push({ kind: 'pre', code: unescapeHtml(code).replace(/\n+$/, '') }); continue }
    if (text !== undefined) {
      if (element) element.text += unescapeHtml(text)
      else if (block) { if (text.trim() !== '') block.parts.push({ kind: 'text', text: collapse(unescapeHtml(text)) }) }
      else assert.equal(text.trim(), '', `text outside a block: ${text}`)
      continue
    }
    if (tag === 'article') continue
    if (tag in INLINE) {
      assert.ok(block, `<${tag}> outside a block`)
      if (!closing) element = { kind: INLINE[tag], text: '', ...(tag === 'a' ? { href: unescapeHtml(/\shref="([^"]*)"/.exec(attrs)[1]) } : {}) }
      else { block.parts.push({ ...element, text: element.kind === 'code' ? element.text : collapse(element.text) }); element = null }
    } else if (tag === 'ul' || tag === 'ol') {
      flush()
      if (closing) lists.pop(); else lists.push(tag === 'ol')
    } else if (tag === 'li') {
      flush()
      if (!closing) block = { kind: 'li', depth: lists.length - 1, ordered: lists.at(-1), parts: [] }
    } else if (tag === 'p' || /^h[1-6]$/.test(tag)) {
      flush()
      if (!closing) block = tag === 'p' ? { kind: 'p', parts: [] } : { kind: 'h', level: Number(tag[1]), parts: [] }
    } else assert.fail(`unexpected <${tag}>`)
  }
  assert.equal(block, null)
  return blocks
}
const fragments = cases.map(({ input }) => readHtml(input))

// --- The reading is the strict task's ---------------------------------------
// Each fragment, written as plain Markdown from the blocks read above, passes
// the strict check, which compares it with the generator's own record. So
// what is expected here is what is expected there, block for block.
// `between(a, b)` is what is written between two neighbouring parts.
const mark = (part) => part.kind === 'strong' ? `**${part.text}**` : part.kind === 'em' ? `*${part.text}*` : part.kind === 'code' ? `\`${part.text}\`` : part.kind === 'link' ? `[${part.text}](${part.href})` : part.text
const write = (blocks, between = () => ' ') => blocks.map((b, k) => {
  if (b.kind === 'pre') return `\`\`\`\n${b.code}\n\`\`\`\n`
  const text = b.parts.map((part, j) => (j ? between(b.parts[j - 1], part) : '') + mark(part)).join('')
  if (b.kind === 'h') return `${'#'.repeat(b.level)} ${text}\n`
  if (b.kind === 'p') return `${text}\n`
  return `${'  '.repeat(b.depth)}${b.ordered ? '1.' : '-'} ${text}${blocks[k + 1]?.kind === 'li' ? '' : '\n'}`
}).join('\n')
for (const [i, blocks] of fragments.entries()) strictVerifyOne(i, write(blocks))

// --- The check --------------------------------------------------------------
// The text of a block is matched with a pattern made from its parts:
//   plain text: its words, one space between them, exactly;
//   strong, emphasis, link text: its characters, with white space allowed or
//     missing anywhere between them;
//   a code span: its characters exactly;
//   between two parts of which at least one is an inline element: a space or
//     nothing. (Between two runs of plain text: a space.)
const quote = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const loose = (s) => [...s.replace(/\s+/g, '')].map(quote).join(' ?')
const pattern = (parts) => new RegExp('^' + parts.map((part, j) => {
  const gap = j === 0 ? '' : part.kind === 'text' && parts[j - 1].kind === 'text' ? ' ' : ' ?'
  return gap + (part.kind === 'text' || part.kind === 'code' ? quote(part.text) : loose(part.text))
}).join('') + '$', 'u')
const squeeze = (s) => s.replace(/\s+/g, '')
const tidyCode = (code) => code.split('\n').map((line) => line.replace(/\s+$/, '')).join('\n')
const expected = fragments.map((blocks) => ({
  blocks: blocks.map((b) => (b.kind === 'pre' ? b : { ...b, text: pattern(b.parts) })),
  links: blocks.flatMap((b) => (b.parts ?? []).filter((p) => p.kind === 'link').map((p) => [squeeze(p.text), p.href])),
  strong: blocks.flatMap((b) => (b.parts ?? []).filter((p) => p.kind === 'strong').map((p) => squeeze(p.text))),
  em: blocks.flatMap((b) => (b.parts ?? []).filter((p) => p.kind === 'em').map((p) => squeeze(p.text))),
  code: blocks.flatMap((b) => (b.parts ?? []).filter((p) => p.kind === 'code').map((p) => p.text)),
}))

export const verifyOne = (i, md) => {
  assert.equal(typeof md, 'string', `fixture ${i}: a string is required`)
  const got = readMarkdown(md)
  const want = expected[i]
  assert.equal(got.tokens.length, want.blocks.length, `fixture ${i}: number of blocks (${got.tokens.length} read, ${want.blocks.length} expected)`)
  for (const [k, b] of want.blocks.entries()) {
    const token = got.tokens[k]
    const where = `fixture ${i}: block ${k}`
    assert.equal(token[0], b.kind, `${where}: a ${b.kind} is expected`)
    if (b.kind === 'pre') { assert.equal(tidyCode(token[1]), tidyCode(b.code), where); continue }
    if (b.kind === 'h') assert.equal(token[1], b.level, `${where}: heading level`)
    if (b.kind === 'li') assert.deepEqual([token[1], token[2]], [b.depth, b.ordered], `${where}: list level and kind`)
    assert.match(token.at(-1), b.text, where)
  }
  assert.deepEqual(got.links.map(([text, href]) => [squeeze(text), href]), want.links, `fixture ${i}: links`)
  assert.deepEqual(got.strong.map(squeeze), want.strong, `fixture ${i}: strong`)
  assert.deepEqual(got.em.map(squeeze), want.em, `fixture ${i}: em`)
  assert.deepEqual(got.code, want.code, `fixture ${i}: code`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = strictConsume

// --- Proofs -----------------------------------------------------------------
// What passes the strict check passes here. What is forgiven passes here and
// not there: no space on either side of an inline element, and a space put
// inside emphasis. What is not forgiven fails here too: the input unchanged,
// the input with its tags stripped, two plain words joined, a word dropped, a
// list flattened, a link without its target, and emphasis written as plain text.
const beside = (a, b) => (a.kind === 'text' && b.kind === 'text' ? ' ' : '')
const spaced = (blocks) => blocks.map((b) => (b.parts ? { ...b, parts: b.parts.map((p) => (p.kind === 'em' && p.text.length > 1 ? { ...p, text: `${p.text[0]} ${p.text.slice(1)}` } : p)) } : b))
const change = (blocks, kind, f) => { let done = false; const out = blocks.map((b) => (b.parts ? { ...b, parts: b.parts.map((p) => { if (done || p.kind !== kind || !f(p)) return p; done = true; return f(p) }) } : b)); assert.ok(done, `no ${kind} to change`); return out }
for (const [i, blocks] of fragments.entries()) {
  verifyOne(i, write(blocks))
  verifyOne(i, write(blocks, beside))
  verifyOne(i, write(spaced(blocks)))
}
const probe = 5
const blocks = fragments[probe]
assert.throws(() => strictVerifyOne(probe, write(blocks, beside)), 'the strict task does not forgive a lost space')
assert.throws(() => strictVerifyOne(probe, write(spaced(blocks))), 'the strict task does not forgive an added space')
const wrong = {
  'the input unchanged': cases[probe].input,
  'the tags stripped': cases[probe].input.replace(/<[^>]+>/g, ''),
  'two plain words joined': write(change(blocks, 'text', (p) => (p.text.includes(' ') ? { ...p, text: p.text.replace(' ', '') } : null))),
  'a word dropped': write(change(blocks, 'text', (p) => (p.text.includes(' ') ? { ...p, text: p.text.slice(p.text.indexOf(' ') + 1) } : null))),
  'a word dropped from a link': write(change(blocks, 'link', (p) => (p.text.includes(' ') ? { ...p, text: p.text.slice(p.text.indexOf(' ') + 1) } : null))),
  'a list flattened': write(blocks.map((b) => (b.kind === 'li' ? { ...b, depth: 0 } : b))),
  'a link without its target': write(change(blocks, 'link', (p) => ({ kind: 'text', text: p.text }))),
  'emphasis as plain text': write(change(blocks, 'em', (p) => ({ kind: 'text', text: p.text }))),
  'a code span changed': write(change(blocks, 'code', (p) => ({ ...p, text: p.text.replace(/\S/, '') }))),
}
for (const [what, md] of Object.entries(wrong)) assert.throws(() => verifyOne(probe, md), undefined, `${what} must fail the check`)
