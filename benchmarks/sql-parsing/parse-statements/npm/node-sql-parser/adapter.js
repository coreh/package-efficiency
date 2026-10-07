import nodeSqlParser from 'node-sql-parser'
const parser = new nodeSqlParser.Parser()
const tree = (e) => e.type === 'binary_expr' ? [e.operator, tree(e.left), tree(e.right)]
  : e.type === 'column_ref' ? ['col', e.table ?? null, e.column]
  : e.type === 'number' ? ['num', e.value] : ['str', e.value]
const names = (list) => list.map((t) => t.table)
export const operation = (sql) => {
  const ast = parser.astify(sql)
  const where = ast.where ? tree(ast.where) : null
  switch (ast.type) {
    case 'select': return { kind: 'select', tables: names(ast.from), columns: [], items: ast.columns.length, where }
    case 'insert': return { kind: 'insert', tables: names(ast.table), columns: ast.columns, items: ast.values.values.length, where }
    case 'update': return { kind: 'update', tables: names(ast.table), columns: ast.set.map((s) => s.column), items: 0, where }
    case 'delete': return { kind: 'delete', tables: names(ast.from), columns: [], items: 0, where }
    case 'create': return { kind: 'create_table', tables: names(ast.table), columns: ast.create_definitions.filter((d) => d.resource === 'column').map((d) => d.column.column), items: 0, where }
    default: throw new Error('unexpected statement: ' + ast.type)
  }
}
