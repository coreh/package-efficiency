require 'pg_query'

OPS = { '=' => '=', '<>' => '<>', '<' => '<', '>' => '>', '<=' => '<=', '>=' => '>=', '~~' => 'like' }.freeze

def cond(n)
  case n.node
  when :bool_expr
    op = n.bool_expr.boolop == :AND_EXPR ? 'and' : 'or'
    args = n.bool_expr.args
    args[1..].reduce(cond(args[0])) { |left, a| [op, left, cond(a)] }
  when :a_expr
    e = n.a_expr
    [OPS.fetch(e.name[0].string.sval), cond(e.lexpr), cond(e.rexpr)]
  when :column_ref
    f = n.column_ref.fields
    f.length == 2 ? ['col', f[0].string.sval, f[1].string.sval] : ['col', nil, f[0].string.sval]
  when :a_const
    c = n.a_const
    c.val == :sval ? ['str', c.sval.sval] : ['num', c.ival.ival]
  else
    raise "unsupported #{n.node}"
  end
end

def from_tables(n, out)
  if n.node == :join_expr
    from_tables(n.join_expr.larg, out)
    from_tables(n.join_expr.rarg, out)
  else
    out << n.range_var.relname
  end
  out
end

def where_of(clause)
  clause.nil? ? nil : cond(clause)
end

def operation(sql)
  stmt = PgQuery.parse(sql).tree.stmts[0].stmt
  case stmt.node
  when :select_stmt
    s = stmt.select_stmt
    tables = []
    s.from_clause.each { |f| from_tables(f, tables) }
    { kind: 'select', tables: tables, columns: [], items: s.target_list.length, where: where_of(s.where_clause) }
  when :insert_stmt
    s = stmt.insert_stmt
    { kind: 'insert', tables: [s.relation.relname], columns: s.cols.map { |c| c.res_target.name },
      items: s.select_stmt.select_stmt.values_lists.length, where: nil }
  when :update_stmt
    s = stmt.update_stmt
    { kind: 'update', tables: [s.relation.relname], columns: s.target_list.map { |c| c.res_target.name },
      items: 0, where: where_of(s.where_clause) }
  when :delete_stmt
    s = stmt.delete_stmt
    { kind: 'delete', tables: [s.relation.relname], columns: [], items: 0, where: where_of(s.where_clause) }
  else
    s = stmt.create_stmt
    { kind: 'create_table', tables: [s.relation.relname],
      columns: s.table_elts.select { |e| e.node == :column_def }.map { |e| e.column_def.colname }, items: 0, where: nil }
  end
end
