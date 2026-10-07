import { strict as assert } from 'node:assert'

// Hand-written-looking stylesheets with the mistakes real CSS contains: old-IE
// hacks, declarations without a colon, empty values, IE expressions,
// unknown at-rules, empty rules. Every mistake sits where browsers (and the
// packages) recover the same way: the broken declaration is dropped or kept as
// a raw node, and the rules and declarations around it survive.
const words = ['alpha', 'beta', 'gamma', 'café', '日本語', 'São Paulo']
const junk = [
  (n) => `  color red;`,
  (n) => `  color: ;`,
  (n) => `  *zoom: 1;\n  _height: ${n % 90}px;`,
  (n) => `  filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=#80000000);`,
  (n) => `  width: expression(document.body.clientWidth > ${n} ? "1px" : "2px");`,
  (n) => `  margin: 1px !imp;`,
  (n) => `  color: red;;`,
]
const selectors = ['', ':hover', '::before', ':not(.off)', '[data-x="1"]', ':nth-child(2n+1)']

const build = (i) => {
  const classes = []
  const marks = []   // numbers that only a correct parse leaves in the tree
  const strings = []
  let rules = 0
  let counter = 10000 + i * 997
  const mark = () => { const n = ++counter; marks.push(String(n)); return n }
  const parts = [`/* hand-edited sheet ${i} */`]
  const rule = (text) => { parts.push(text); rules++ }
  const total = 10 + (i * 7) % 24

  for (let j = 0; j < total; j++) {
    const c = `e${i}-${j}`
    classes.push(c)
    const sel = `.${c}${selectors[(i + j) % selectors.length]}`
    const decls = [`  order: ${mark()};`, `  display: flex;`]
    const label = `${words[(i + j) % words.length]} ${i}-${j}`
    if (j % 3 === 0) { strings.push(label); decls.push(`  content: "${label}";`) }
    if (j % 4 !== 3) {
      decls.push(junk[(i + j) % junk.length](j))
      decls.push(`  z-index: ${mark()};`)
    }
    if (j % 5 === 0) decls.push(`  margin: ${j}px auto`, )
    rule(`${sel} {\n${decls.join('\n')}\n}`)
    if (j % 6 === 1) rule(`.${c}-empty { }`)
    if (j % 6 === 1) classes.push(`${c}-empty`)
    if (j % 7 === 2) rule(`@media (max-width: ${400 + j * 20}px) {\n  .${c}-m { order: ${mark()}; color: ; z-index: ${mark()}; }\n}`), classes.push(`${c}-m`)
    if (j % 9 === 4) rule(`@-webkit-foo bar${j} {\n  .${c}-u { order: ${mark()}; }\n}`), classes.push(`${c}-u`)
    if (j % 8 === 5) parts.push(`/* TODO fix ${label} */`)
  }
  rule(`.tail-${i} { order: ${mark()}; }`)
  classes.push(`tail-${i}`)
  return { input: parts.join('\n') + '\n', expected: { rules, classes, marks, strings } }
}
export const cases = Array.from({ length: 32 }, (_, i) => build(i))

// Every string and number reachable in plain objects, arrays and iterable lists.
const harvest = (root) => {
  const seen = new Set()
  const out = []
  const walk = (node) => {
    if (typeof node === 'string') { out.push(node); return }
    if (typeof node === 'number') { out.push(String(node)); return }
    if (node === null || typeof node !== 'object' || seen.has(node)) return
    seen.add(node)
    if (typeof node[Symbol.iterator] === 'function') { for (const child of node) walk(child); return }
    for (const key of Object.keys(node)) walk(node[key])
  }
  walk(root)
  return out
}
const topLevel = (tree) => {
  if (tree.type === 'StyleSheet') return [...tree.children].length
  if (tree.type === 'stylesheet') return tree.stylesheet.rules.filter((r) => r.type !== 'comment').length
  throw new assert.AssertionError({ message: 'unrecognised tree shape' })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const tree = outputs[i]
    assert.ok(tree && typeof tree === 'object', `fixture ${i}: tree required`)
    assert.equal(topLevel(tree), expected.rules, `fixture ${i}: top-level rule count`)
    // @adobe/css-tools also lists its errors, each with the rest of the source
    // text; only the rules are searched.
    const found = harvest(tree.type === 'stylesheet' ? tree.stylesheet.rules : tree)
    // A tree holds pieces of the sheet, never a block of it: a result that
    // wraps the input text would still contain braces.
    assert.ok(!found.some((s) => s.includes('{')), `fixture ${i}: unparsed text in tree`)
    const text = found.join('\u0000')
    for (const item of [...expected.classes, ...expected.marks, ...expected.strings]) {
      assert.ok(text.includes(item), `fixture ${i}: missing ${JSON.stringify(item)}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (tree) => tree.type === 'StyleSheet' ? tree.children.size : tree.stylesheet.rules.length
