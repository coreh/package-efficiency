import { strict as assert } from 'node:assert'
const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'café', '日本語', 'São Paulo']
const colors = ['#1a2b3c', 'rgb(12, 34, 56)', 'hsl(210 40% 50%)', 'var(--c-%i)', 'transparent', 'rgba(0,0,0,.5)']
const combinators = [' ', ' > ', ' + ', ' ~ ']
const pseudo = ['', ':hover', ':focus-visible', ':not(.off)', '::before', ':nth-child(2n+1)', '[data-state="open"]', '[type=text]']

const build = (i) => {
  const classes = []
  const names = []
  const strings = []
  const customs = []
  let rules = 0
  const parts = [`/* component sheet ${i} */`]
  const rule = (text) => { parts.push(text); rules++ }
  const cls = (j) => { const c = `c${i}-${j}`; classes.push(c); return c }

  if (i % 3 === 0) rule(`@import url("theme-${i}.css") screen;`)
  const vars = Array.from({ length: 3 + i % 4 }, (_, j) => { const n = `--c-${i}-${j}`; customs.push(n); return `  ${n}: ${colors[j % colors.length].replace('%i', `${j}`).replace('var(--c-' + j + ')', '#fff')};` })
  rule(`:root {\n${vars.join('\n')}\n}`)
  const fontName = `Face${i}`
  strings.push(fontName, `fonts/face-${i}.woff2`)
  rule(`@font-face {\n  font-family: "${fontName}";\n  src: url("fonts/face-${i}.woff2") format("woff2");\n  font-display: swap;\n}`)

  const count = 8 + (i * 5) % 22
  for (let j = 0; j < count; j++) {
    const a = cls(j)
    const sel = `.${a}${pseudo[(i + j) % pseudo.length]}`
    const second = j % 4 === 0 ? `, .${cls(1000 + j)} .item${combinators[j % 4]}a` : j % 5 === 0 ? `, #id-${i}-${j}${combinators[j % 4]}.${cls(2000 + j)}` : ''
    const label = `${words[(i + j) % words.length]} ${i}-${j}`
    if (j % 2 === 0) strings.push(label)
    const decls = [
      `  margin: ${j}px ${j + 1}rem ${j % 3}em auto;`,
      `  color: ${colors[j % colors.length].replace('%i', `${j}`)};`,
      `  width: calc(100% - ${10 + j}px);`,
      j % 3 === 0 ? `  background: url("img/${i}-${j}.png") no-repeat center / cover;` : `  padding: ${(j % 5) * 4}px;`,
      j % 4 === 1 ? `  display: none !important;` : `  display: flex;`,
      j % 2 === 0 ? `  content: "${label}";` : `  font: italic bold ${12 + j % 6}px/1.5 "${fontName}", sans-serif;`,
      j % 6 === 2 ? `  transition: opacity .${j}s ease-in-out, transform 200ms;` : `  line-height: 1.${j % 10};`,
      j % 7 === 3 ? `  --local-${i}-${j}: ${j};` : `  z-index: ${j};`,
    ]
    if (j % 7 === 3) customs.push(`--local-${i}-${j}`)
    rule(`${sel}${second} {\n${decls.join('\n')}\n}`)
    if (j % 6 === 5) parts.push(`/* section ${j}: ${label} */`)
    if (j % 8 === 7) {
      const inner = `.${cls(3000 + j)}`
      rule(`@media (min-width: ${320 + j * 40}px) and (max-width: ${1200 + j}px) {\n  ${inner} { display: block; margin: 0 auto; }\n  .${a} { padding: ${j}px; color: ${colors[0]}; }\n}`)
    }
    if (j % 9 === 4) rule(`@supports (display: grid) {\n  .${cls(4000 + j)} { display: grid; grid-template-columns: repeat(${2 + j % 3}, 1fr); gap: ${j}px; }\n}`)
  }
  const kf = `spin-${i}`
  names.push(kf)
  rule(`@keyframes ${kf} {\n  from { transform: rotate(0deg); }\n  50% { opacity: .5; }\n  to { transform: rotate(360deg); }\n}`)
  rule(`@media print {\n  .${cls(5000)} { display: none; }\n}`)
  rule(`@media (prefers-color-scheme: dark) {\n  :root { --c-${i}-0: #111; }\n  .${a0(i)} { color: #eee; }\n}`)
  return { input: parts.join('\n') + '\n', expected: { rules, classes, names, strings, customs } }
}
const a0 = (i) => `c${i}-0`
export const cases = Array.from({ length: 36 }, (_, i) => build(i))

// Collect every string and number reachable in a tree of plain objects, arrays
// and iterable lists, skipping cycles. Tree shapes differ between packages.
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
  return out.join('\u0000')
}
const topLevel = (tree) => {
  if (tree.type === 'StyleSheet') return [...tree.children].length
  if (tree.type === 'stylesheet') return tree.stylesheet.rules.filter((r) => r.type !== 'comment').length
  if (Array.isArray(tree.rules)) return tree.rules.length
  if (Array.isArray(tree)) return tree.length
  throw new assert.AssertionError({ message: 'unrecognised tree shape' })
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const tree = outputs[i]
    assert.ok(tree && typeof tree === 'object', `fixture ${i}: tree required`)
    assert.equal(topLevel(tree), expected.rules, `fixture ${i}: top-level rule count`)
    const text = harvest(tree)
    for (const item of [...expected.classes, ...expected.names, ...expected.strings, ...expected.customs]) {
      assert.ok(text.includes(item), `fixture ${i}: missing ${JSON.stringify(item)}`)
    }
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (tree) => tree.type === 'StyleSheet' ? tree.children.size : tree.stylesheet.rules.length
