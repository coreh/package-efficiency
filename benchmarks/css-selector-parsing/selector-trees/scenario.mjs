import { strict as assert } from 'node:assert'
// Each compound: [source, expected tokens]
const compounds = [
  ['a', ['tag:a']], ['div.card', ['tag:div', 'class:card']], ['#main', ['id:main']],
  ['*', ['universal']], ['ul.nav.nav-pills', ['tag:ul', 'class:nav', 'class:nav-pills']],
  ['input[type="text"]', ['tag:input', 'attr:type']], ['a[href]', ['tag:a', 'attr:href']],
  ['[data-id=\'42\']', ['attr:data-id']], ['a[href^="https://"]', ['tag:a', 'attr:href']],
  ['li:first-child', ['tag:li', 'pseudo:first-child']], ['button:hover', ['tag:button', 'pseudo:hover']],
  ['p::before', ['tag:p', 'pseudo:before']], ['.item:not(.disabled)', ['class:item', 'pseudo:not']],
  ['tr:nth-child(2n+1)', ['tag:tr', 'pseudo:nth-child']], ['input:checked + label', null],
  ['section#intro.hero[role="banner"]:focus-within', ['tag:section', 'id:intro', 'class:hero', 'attr:role', 'pseudo:focus-within']],
  ['.btn:not(.btn-primary):not([disabled])', ['class:btn', 'pseudo:not', 'pseudo:not']],
  ['h1', ['tag:h1']], ['span.label', ['tag:span', 'class:label']], ['[aria-hidden="true"]', ['attr:aria-hidden']],
  ['td:nth-of-type(odd)', ['tag:td', 'pseudo:nth-of-type']], ['*::selection', ['universal', 'pseudo:selection']],
  ['.a.b.c.d', ['class:a', 'class:b', 'class:c', 'class:d']], ['img[alt][src$=".png"]', ['tag:img', 'attr:alt', 'attr:src']],
].filter(([, t]) => t)
const combs = [' ', ' > ', ' + ', ' ~ ', '>', '   ', ' >  ', '+']
export const cases = Array.from({ length: 60 }, (_, i) => {
  const lists = 1 + (i % 3)
  const expected = []
  const parts = []
  for (let l = 0; l < lists; l++) {
    const n = 1 + ((i * 3 + l * 5) % 5)
    let src = ''
    const toks = []
    for (let k = 0; k < n; k++) {
      const [s, t] = compounds[(i * 7 + l * 11 + k * 13 + (i >> 2)) % compounds.length]
      if (k) { src += combs[(i + l + k) % combs.length]; toks.push('combinator') }
      src += s
      toks.push(...t)
    }
    parts.push(src)
    expected.push(toks)
  }
  return { input: parts.join(i % 2 ? ', ' : ','), expected }
})
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) assert.deepEqual(outputs[i], expected, `fixture ${i}: ${cases[i].input}`)
}
// Each library returns its own tree; it is mapped to the common shape here,
// outside timing. css-what: an array of arrays of token objects, with classes
// and ids as attribute tokens. postcss-selector-parser: a Root of Selector nodes.
const COMBINATORS = new Set(['combinator', 'descendant', 'child', 'parent', 'sibling', 'adjacent', 'column-combinator'])
const token = (t) => {
  if (COMBINATORS.has(t.type)) return 'combinator'
  switch (t.type) {
    case 'tag': return `tag:${t.name ?? t.value}`
    case 'universal': return 'universal'
    case 'class': return `class:${t.value}`
    case 'id': return `id:${t.value}`
    case 'pseudo': case 'pseudo-element': return `pseudo:${(t.name ?? t.value).replace(/^:+/, '')}`
    case 'attribute':
      if (t.attribute !== undefined) return `attr:${t.attribute}`
      if (t.name === 'class' && t.action === 'element') return `class:${t.value}`
      if (t.name === 'id' && t.action === 'equals') return `id:${t.value}`
      return `attr:${t.name}`
    default: return t.type
  }
}
const project = (tree) => {
  assert.ok(tree && typeof tree === 'object' && tree !== null, 'a parsed tree is required')
  const selectors = Array.isArray(tree) ? tree : tree.nodes
  assert.ok(Array.isArray(selectors), 'a list of selectors is required')
  return selectors.map((selector) => (Array.isArray(selector) ? selector : selector.nodes).map(token))
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => project(operation(input))))
// The number of comma-separated selectors in either tree.
export const consume = (tree) => (tree.nodes ?? tree).length
