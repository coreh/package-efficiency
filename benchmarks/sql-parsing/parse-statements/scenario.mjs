import { strict as assert } from 'node:assert'
// Statements are written piece by piece together with what a parser must find
// in them. The common result is
//   { kind, tables, columns, items, where }
// kind:    'select' | 'insert' | 'update' | 'delete' | 'create_table'
// tables:  names of the tables read or written, in the order they appear
// columns: names of the columns inserted into, assigned or defined ([] for select and delete)
// items:   select: number of result columns; insert: number of rows; otherwise 0
// where:   the WHERE condition as a tree, or null:
//          ['and' | 'or' | '=' | '<>' | '<' | '>' | '<=' | '>=' | 'like', left, right]
//          ['col', table or null, column]   ['num', integer]   ['str', text]
const tablesPool = ['orders', 'customers', 'line_items', 'products', 'payments', 'shipments', 'accounts', 'audit_log']
const colsPool = ['id', 'status', 'total', 'created_at', 'customer_id', 'region', 'quantity', 'price', 'email', 'updated_by', 'note', 'sku']
const texts = ['open', 'closed', 'north-east', "O''Brien", 'a%b', '2026-10-07', 'x y z', 'pending review']
const pick = (pool, i, k = 0) => pool[(i * 7 + k * 5) % pool.length]
const lit = (s) => `'${s}'`
const unlit = (s) => s.replace(/''/g, "'")
// A deterministic condition of `size` comparisons. Returns [sql, tree, precedence].
const comparisons = ['=', '<>', '<', '>', '<=', '>=']
const condition = (seed, size, alias) => {
  if (size <= 1) {
    const col = pick(colsPool, seed, 1), qualified = alias && seed % 3 !== 0
    const left = [qualified ? `${alias}.${col}` : col, ['col', qualified ? alias : null, col]]
    const form = seed % 5
    if (form === 3) { const t = pick(texts, seed); return [`${left[0]} = ${lit(t)}`, ['=', left[1], ['str', unlit(t)]], 3] }
    if (form === 4) { const t = pick(texts, seed, 2); return [`${left[0]} LIKE ${lit(t + '%')}`, ['like', left[1], ['str', unlit(t) + '%']], 3] }
    const op = comparisons[seed % comparisons.length], n = (seed * 37) % 1000
    if (form === 2) { const other = pick(colsPool, seed, 4); return [`${left[0]} ${op} ${other}`, [op, left[1], ['col', null, other]], 3] }
    return [`${left[0]} ${op} ${n}`, [op, left[1], ['num', n]], 3]
  }
  const op = seed % 3 === 0 ? 'or' : 'and', prec = op === 'or' ? 1 : 2
  const split = 1 + (seed % (size - 1))
  const sides = [condition(seed * 3 + 1, split, alias), condition(seed * 5 + 2, size - split, alias)]
  // Parentheses where precedence needs them, and now and then where it does not.
  const text = sides.map(([sql, , p], k) => p < prec || (p === prec && k === 1) || (seed + k) % 7 === 0 ? `(${sql})` : sql)
  return [`${text[0]} ${op.toUpperCase()} ${text[1]}`, [op, sides[0][1], sides[1][1]], prec]
}
const select = (i) => {
  const t = pick(tablesPool, i), j = pick(tablesPool, i, 1), j2 = pick(tablesPool, i, 2), joins = i % 4
  const a = joins ? 'a' : null
  const q = (c) => (a ? `${a}.${c}` : c)
  const cols = Array.from({ length: 2 + (i % 9) }, (_, k) => {
    const c = pick(colsPool, i, k)
    return k % 5 === 3 ? `COUNT(*) AS n${k}` : k % 5 === 4 ? `SUM(${q(c)} * 2) AS sum_${k}` : k % 7 === 5 ? `CASE WHEN ${q(c)} > ${k} THEN ${lit('hi')} ELSE ${lit('lo')} END AS band${k}` : k % 3 === 1 ? `${q(c)} AS ${c}_${k}` : q(c)
  })
  let sql = `SELECT ${cols.join(', ')} FROM ${t}${a ? ' AS a' : ''}`
  const tables = [t]
  if (joins >= 1) { sql += ` ${i % 2 ? 'LEFT JOIN' : 'INNER JOIN'} ${j} AS b ON b.${pick(colsPool, i, 3)} = a.id`; tables.push(j) }
  if (joins >= 2) { sql += ` JOIN ${j2} AS c ON c.id = b.${pick(colsPool, i, 5)} AND c.status <> ${lit('void')}`; tables.push(j2) }
  let where = null
  if (i % 6 !== 5) { const [text, tree] = condition(i + 11, 1 + (i % 7), a); sql += ` WHERE ${text}`; where = tree }
  if (i % 3 === 0) sql += ` GROUP BY ${q(pick(colsPool, i, 0))}, ${q(pick(colsPool, i, 1))} HAVING COUNT(*) > ${i % 9}`
  if (i % 2 === 0) sql += ` ORDER BY ${q(pick(colsPool, i, 2))} DESC, ${q(pick(colsPool, i, 0))}`
  if (i % 4 === 1) sql += ` LIMIT ${10 + i}`
  return { input: sql, expected: { kind: 'select', tables, columns: [], items: cols.length, where } }
}
const insert = (i) => {
  const t = pick(tablesPool, i, 3), n = 3 + (i % 6), rows = 1 + (i % 5) * 3
  const columns = Array.from({ length: n }, (_, k) => pick(colsPool, i, k))
  const row = (r) => `(${columns.map((_, k) => (k % 3 === 0 ? String(r * 100 + k) : k % 3 === 1 ? lit(pick(texts, i + r, k)) : k % 2 ? 'NULL' : `${r} * ${k + 1}`)).join(', ')})`
  return { input: `INSERT INTO ${t} (${columns.join(', ')}) VALUES ${Array.from({ length: rows }, (_, r) => row(r)).join(', ')}`, expected: { kind: 'insert', tables: [t], columns, items: rows, where: null } }
}
const update = (i) => {
  const t = pick(tablesPool, i, 4), n = 1 + (i % 5)
  const columns = Array.from({ length: n }, (_, k) => pick(colsPool, i, k + 2))
  const sets = columns.map((c, k) => `${c} = ${k % 3 === 0 ? `${c} + ${k + 1}` : k % 3 === 1 ? lit(pick(texts, i, k)) : String(i * 10 + k)}`)
  const [text, where] = condition(i + 5, 1 + (i % 4), null)
  return { input: `UPDATE ${t} SET ${sets.join(', ')} WHERE ${text}`, expected: { kind: 'update', tables: [t], columns, items: 0, where } }
}
const remove = (i) => {
  const t = pick(tablesPool, i, 5)
  const [text, where] = condition(i + 3, 1 + (i % 5), null)
  return { input: `DELETE FROM ${t} WHERE ${text}`, expected: { kind: 'delete', tables: [t], columns: [], items: 0, where } }
}
const types = ['INT', 'VARCHAR(255)', 'DECIMAL(10, 2)', 'TEXT', 'TIMESTAMP', 'BOOLEAN', 'VARCHAR(32)']
const createTable = (i) => {
  const t = `${pick(tablesPool, i, 6)}_v${i}`, n = 3 + (i % 8)
  const columns = ['id', ...Array.from({ length: n }, (_, k) => `${pick(colsPool, i, k + 1)}_${k}`)]
  const defs = columns.map((c, k) => (k === 0 ? 'id INT NOT NULL' : `${c} ${types[(i + k) % types.length]}${k % 3 === 0 ? ' NOT NULL' : ''}${k % 4 === 1 ? ' DEFAULT 0' : ''}`))
  return { input: `CREATE TABLE ${t} (${defs.join(', ')}, PRIMARY KEY (id))`, expected: { kind: 'create_table', tables: [t], columns, items: 0, where: null } }
}
const makers = [select, select, insert, select, update, select, remove, createTable]
export const cases = Array.from({ length: 64 }, (_, i) => makers[i % makers.length](i))

// AND and OR are associative, so a chain may be grouped either way: both
// sides are flattened before comparing. Everything else must match exactly.
const flatten = (node) => {
  if (!Array.isArray(node)) return node
  const [op, ...rest] = node
  if (op !== 'and' && op !== 'or') return [op, ...rest.map(flatten)]
  return [op, ...rest.map(flatten).flatMap((child) => (Array.isArray(child) && child[0] === op ? child.slice(1) : [child]))]
}
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(output && typeof output === 'object', `fixture ${i}: a result object is required`)
  const got = { kind: output.kind, tables: [...output.tables], columns: [...output.columns], items: output.items, where: flatten(output.where ?? null) }
  assert.deepEqual(got, { ...expected, where: flatten(expected.where) }, `fixture ${i}: ${input.slice(0, 200)}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.tables.length + value.columns.length + value.items
