import { strict as assert } from 'node:assert'
// Each template returns source text plus what a correct tree must contain:
// top-level names, CallExpression count and FunctionDeclaration count
// (including nested ones). Counts are known by construction.
const templates = [
  (k) => ({
    code: `function calc${k}(a, b = 2, ...rest) {\n  const total = [a, b, ...rest].reduce((s, x) => s + x, 0);\n  if (total > ${k}) {\n    return Math.max(total, ${k});\n  }\n  return total;\n}\n`,
    names: [`calc${k}`], calls: 2, funcs: 1, statements: 1,
  }),
  (k) => ({
    code: `class Shape${k} extends Base {\n  constructor(x, y) {\n    super(x, y);\n    this.items = new Map();\n  }\n  get size() {\n    return this.items.size;\n  }\n  add(key, value) {\n    this.items.set(key, value);\n    return this;\n  }\n  static of(...args) {\n    return new Shape${k}(...args);\n  }\n}\n`,
    names: [`Shape${k}`], calls: 2, funcs: 0, statements: 1,
  }),
  (k) => ({
    code: `const table${k} = {\n  alpha: ${k},\n  'beta-gamma': [1, 2, 3, ${k}],\n  nested: {\n    fn() { return this.alpha * 2; },\n    ['key' + ${k}]: true,\n    text: \`value \${${k}} and café 日本語 😀\`,\n  },\n  pattern: /^[a-z]+\\d{${k % 5 + 1}}$/gi,\n  big: 0x${(k * 4099).toString(16)},\n};\n`,
    names: [`table${k}`], calls: 0, funcs: 0, statements: 1,
  }),
  (k) => ({
    code: `async function load${k}(url) {\n  try {\n    const res = await fetch(url + '/page/${k}');\n    const data = await res.json();\n    return data.items.filter((x) => x.ok).map((x) => x.id);\n  } catch (err) {\n    console.error(\`failed \${url}: \${err.message}\`);\n    return [];\n  } finally {\n    cleanup();\n  }\n}\n`,
    names: [`load${k}`], calls: 6, funcs: 1, statements: 1,
  }),
  (k) => ({
    code: `function* gen${k}(n) {\n  for (let i = 0; i < n; i++) {\n    if (i % 2 === 0) continue;\n    yield i * ${k};\n  }\n}\n`,
    names: [`gen${k}`], calls: 0, funcs: 1, statements: 1,
  }),
  (k) => ({
    code: `function classify${k}(s) {\n  switch (typeof s) {\n    case 'string':\n      return /^[a-z]+\\d*$/i.test(s) ? 'word' : 'text';\n    case 'number':\n      return s > ${k} ? 'big' : 'small';\n    default:\n      return 'other';\n  }\n}\n`,
    names: [`classify${k}`], calls: 1, funcs: 1, statements: 1,
  }),
  (k) => ({
    code: `registry.register('item${k}', function inner${k}(opts) {\n  const { a, b: [c, d = 4] } = opts;\n  return a + c + d + ${k};\n});\n`,
    names: [], calls: 1, funcs: 0, statements: 1,
  }),
  (k) => ({
    code: `var counter${k} = 0;\nwhile (counter${k} < 10) {\n  counter${k} += ${k % 3 + 1};\n}\ndo {\n  counter${k}--;\n} while (counter${k} > 0);\n`,
    names: [`counter${k}`], calls: 0, funcs: 0, statements: 3,
  }),
  (k) => ({
    code: `(function () {\n  'use strict';\n  var x = ${k};\n  return x * 2;\n})();\n`,
    names: [], calls: 1, funcs: 0, statements: 1,
  }),
  (k) => ({
    code: `let list${k} = [];\nfor (const key in source${k}) {\n  if (Object.prototype.hasOwnProperty.call(source${k}, key)) list${k}.push(key.toUpperCase());\n}\nouter: for (let i = 0; i < ${k + 2}; i++) {\n  for (let j = 0; j < i; j++) {\n    if (j === 3) break outer;\n    list${k}.push(i * j);\n  }\n}\n`,
    names: [`list${k}`], calls: 4, funcs: 0, statements: 3,
  }),
]
const build = (i) => {
  const pieces = 40 + ((i * 37) % 60) * 2 + (i % 4) * 9
  const parts = []
  const names = []
  let calls = 0, funcs = 0, statements = 0
  for (let k = 0; k < pieces; k++) {
    const t = templates[(k * 7 + i * 3 + (k >> 2)) % templates.length](i * 1000 + k)
    parts.push(t.code)
    names.push(...t.names)
    calls += t.calls; funcs += t.funcs; statements += t.statements
  }
  return { input: `// generated program ${i}\n` + parts.join('\n'), expected: { statements, names, calls, funcs } }
}
export const cases = Array.from({ length: 40 }, (_, i) => build(i))
const skip = new Set(['loc', 'range', 'start', 'end', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments', 'innerComments'])
const count = (node, tally) => {
  if (Array.isArray(node)) { for (const child of node) count(child, tally); return }
  if (node === null || typeof node !== 'object') return
  if (typeof node.type === 'string') {
    if (node.type === 'CallExpression') tally.calls++
    else if (node.type === 'FunctionDeclaration') tally.funcs++
  }
  for (const key of Object.keys(node)) if (!skip.has(key)) count(node[key], tally)
}
const declared = (statement) => {
  if (statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration') return [statement.id.name]
  if (statement.type === 'VariableDeclaration') return statement.declarations.map((d) => d.id.name)
  return []
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected }] of cases.entries()) {
    const out = outputs[i]
    assert.ok(out && typeof out === 'object', `fixture ${i}: tree required`)
    if (Array.isArray(out.errors)) assert.equal(out.errors.length, 0, `fixture ${i}: parser reported errors`)
    const program = out.program ?? out
    assert.equal(program.type, 'Program', `fixture ${i}: Program node required`)
    assert.equal(program.body.length, expected.statements, `fixture ${i}: statement count`)
    assert.deepStrictEqual(program.body.flatMap(declared), expected.names, `fixture ${i}: declared names`)
    const tally = { calls: 0, funcs: 0 }
    count(program, tally)
    assert.equal(tally.calls, expected.calls, `fixture ${i}: call count`)
    assert.equal(tally.funcs, expected.funcs, `fixture ${i}: function declaration count`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value.program ?? value).body.length
