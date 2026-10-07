import { parseFirst } from 'pgsql-ast-parser'
const tree = (e) => e.type === 'binary' ? [e.op, tree(e.left), tree(e.right)]
  : e.type === 'ref' ? ['col', e.table?.name ?? null, e.name]
  : e.type === 'integer' ? ['num', e.value] : ['str', e.value]
export const operation = (sql) => {
  const ast = parseFirst(sql)
  const where = ast.where ? tree(ast.where) : null
  switch (ast.type) {
    case 'select': return { kind: 'select', tables: ast.from.map((f) => f.name.name), columns: [], items: ast.columns.length, where }
    case 'insert': return { kind: 'insert', tables: [ast.into.name], columns: ast.columns.map((c) => c.name), items: ast.insert.values.length, where }
    case 'update': return { kind: 'update', tables: [ast.table.name], columns: ast.sets.map((s) => s.column.name), items: 0, where }
    case 'delete': return { kind: 'delete', tables: [ast.from.name], columns: [], items: 0, where }
    case 'create table': return { kind: 'create_table', tables: [ast.name.name], columns: ast.columns.filter((c) => c.kind === 'column').map((c) => c.name.name), items: 0, where }
    default: throw new Error('unexpected statement: ' + ast.type)
  }
}
