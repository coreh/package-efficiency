import { strict as assert } from 'node:assert'
// Each template returns module text plus what a correct tree must contain.
// Counts are known by construction.
const t = (code, o = {}) => ({ code, names: [], statements: 1, imports: 0, exports: 0, optional: 0, nullish: 0, bigint: 0, dynamic: 0, meta: 0, ...o })
const templates = [
  (k) => t(`import { a${k}, b${k} as c${k} } from './mod${k}.js';\n`, { imports: 1 }),
  (k) => t(`import def${k}, * as all${k} from './all${k}.js';\n`, { imports: 1 }),
  (k) => t(`export async function fetch${k}(url, { retries = 3, ...rest } = {}) {\n  const res = await fetch(url, rest);\n  return res?.json?.() ?? null;\n}\n`, { names: [`fetch${k}`], exports: 1, optional: 2, nullish: 1 }),
  (k) => t(`export class Widget${k} extends Base {\n  constructor(items = []) {\n    super();\n    this.items = items;\n  }\n  get first() {\n    return this.items?.[0]?.name ?? 'none';\n  }\n  static of(...args) {\n    return new Widget${k}(args);\n  }\n}\n`, { names: [`Widget${k}`], exports: 1, optional: 2, nullish: 1 }),
  (k) => t(`export const big${k} = 123456789012345678901234567890n * ${k}n;\nconst mask${k} = 0xffn & BigInt(${k});\n`, { names: [`big${k}`, `mask${k}`], statements: 2, exports: 1, bigint: 3 }),
  (k) => t(`const lazy${k} = () => import('./chunks/${k}.js');\n`, { names: [`lazy${k}`], dynamic: 1 }),
  (k) => t(`export async function* stream${k}(source) {\n  for await (const chunk of source) {\n    yield chunk?.data ?? [];\n  }\n}\n`, { names: [`stream${k}`], exports: 1, optional: 1, nullish: 1 }),
  (k) => t(`export * from './reexport${k}.js';\n`, { exports: 1 }),
  (k) => t(`export * as ns${k} from './ns${k}.js';\n`, { exports: 1 }),
  (k) => t(`const local${k} = import.meta.url;\nexport { local${k} as alias${k} };\n`, { names: [`local${k}`], statements: 2, exports: 1, meta: 1 }),
  (k) => t(`const settings${k} = {\n  host: process.env.HOST ?? 'localhost',\n  port: Number(process.env.PORT ?? ${8000 + (k % 100)}),\n  tags: ['a', 'b', \`t\${${k}}\`],\n  nested: { ...defaults, mode: opts?.mode ?? 'dev', label: 'café 日本語 😀' },\n};\n`, { names: [`settings${k}`], optional: 1, nullish: 3 }),
  (k) => t(`function parse${k}(text) {\n  try {\n    return JSON.parse(text);\n  } catch {\n    return undefined;\n  }\n}\nexport { parse${k} };\n`, { names: [`parse${k}`], statements: 2, exports: 1 }),
  (k) => t(`export const total${k} = (list) => list.reduce((s, { price = ${k % 9}, qty = 1 }) => s + price * qty, 0);\n`, { names: [`total${k}`], exports: 1 }),
  (k) => t(`export default async function main${k}(argv) {\n  const { default: mod } = await import(\`./plugins/\${argv[0]}.js\`);\n  return mod?.run?.(argv.slice(1)) ?? 0;\n}\n`, { names: [`main${k}`], exports: 1, optional: 2, nullish: 1, dynamic: 1 }),
]
const build = (i) => {
  const pieces = 12 + ((i * 37) % 40) + (i % 5) * 6
  const parts = []
  const exp = { names: [], statements: 0, imports: 0, exports: 0, optional: 0, nullish: 0, bigint: 0, dynamic: 0, meta: 0 }
  let hasDefault = false
  for (let k = 0; k < pieces; k++) {
    let idx = (k * 5 + i * 3 + (k >> 2)) % templates.length
    if (idx === 13) { if (hasDefault) idx = 12; else hasDefault = true }
    const x = templates[idx](i * 1000 + k)
    parts.push(x.code)
    exp.names.push(...x.names)
    for (const key of Object.keys(exp)) if (key !== 'names') exp[key] += x[key]
  }
  return { input: `// generated module ${i}\n` + parts.join('\n'), expected: exp }
}
export const cases = Array.from({ length: 40 }, (_, i) => build(i))
const skip = new Set(['loc', 'range', 'start', 'end', 'tokens', 'comments', 'extra', 'leadingComments', 'trailingComments', 'innerComments'])
const count = (node, tally) => {
  if (Array.isArray(node)) { for (const child of node) count(child, tally); return }
  if (node === null || typeof node !== 'object') return
  const type = node.type
  if (typeof type === 'string') {
    if (type === 'ImportDeclaration') tally.imports++
    else if (type === 'ExportNamedDeclaration' || type === 'ExportAllDeclaration' || type === 'ExportDefaultDeclaration') tally.exports++
    else if (type === 'LogicalExpression' && node.operator === '??') tally.nullish++
    else if (type === 'BigIntLiteral' || (type === 'Literal' && typeof node.bigint === 'string')) tally.bigint++
    else if (type === 'ImportExpression' || (type === 'CallExpression' && node.callee && node.callee.type === 'Import')) tally.dynamic++
    else if (type === 'MetaProperty' && node.meta && node.meta.name === 'import') tally.meta++
    if (node.optional === true) tally.optional++
  }
  for (const key of Object.keys(node)) if (!skip.has(key)) count(node[key], tally)
}
const declared = (statement) => {
  if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') {
    return statement.declaration ? declared(statement.declaration) : []
  }
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
    assert.equal(program.sourceType, 'module', `fixture ${i}: parsed as a module`)
    assert.equal(program.body.length, expected.statements, `fixture ${i}: statement count`)
    assert.deepStrictEqual(program.body.flatMap(declared), expected.names, `fixture ${i}: declared names`)
    const tally = { imports: 0, exports: 0, optional: 0, nullish: 0, bigint: 0, dynamic: 0, meta: 0 }
    count(program, tally)
    for (const key of Object.keys(tally)) assert.equal(tally[key], expected[key], `fixture ${i}: ${key} count`)
  }
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => (value.program ?? value).body.length
