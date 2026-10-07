import { parse } from 'sql-parser-cst'
const options = { dialect: 'postgresql' }
const tree = (e) => {
  switch (e.type) {
    case 'paren_expr': return tree(e.expr)
    case 'binary_expr': return [typeof e.operator === 'string' ? e.operator : e.operator.name, tree(e.left), tree(e.right)]
    case 'member_expr': return ['col', e.object.name, e.property.name]
    case 'identifier': return ['col', null, e.name]
    case 'number_literal': return ['num', e.value]
    default: return ['str', e.value]
  }
}
const name = (e) => (e.type === 'alias' ? e.expr.name : e.name)
const joined = (e, out) => {
  if (e.type === 'join_expr') { joined(e.left, out); out.push(name(e.right)) } else out.push(name(e))
  return out
}
const clause = (stmt, type) => stmt.clauses.find((c) => c.type === type)
export const operation = (sql) => {
  const stmt = parse(sql, options).statements[0]
  if (stmt.type === 'create_table_stmt') return { kind: 'create_table', tables: [stmt.name.name], columns: stmt.columns.expr.items.filter((c) => c.type === 'column_definition').map((c) => c.name.name), items: 0, where: null }
  const condition = clause(stmt, 'where_clause')
  const where = condition ? tree(condition.expr) : null
  switch (stmt.type) {
    case 'select_stmt': return { kind: 'select', tables: joined(clause(stmt, 'from_clause').expr, []), columns: [], items: clause(stmt, 'select_clause').columns.items.length, where }
    case 'insert_stmt': { const into = clause(stmt, 'insert_clause'); return { kind: 'insert', tables: [into.table.name], columns: into.columns.expr.items.map((c) => c.name), items: clause(stmt, 'values_clause').values.items.length, where } }
    case 'update_stmt': return { kind: 'update', tables: clause(stmt, 'update_clause').tables.items.map(name), columns: clause(stmt, 'set_clause').assignments.items.map((a) => a.column.name), items: 0, where }
    case 'delete_stmt': return { kind: 'delete', tables: clause(stmt, 'delete_clause').tables.items.map(name), columns: [], items: 0, where }
    default: throw new Error('unexpected statement: ' + stmt.type)
  }
}
