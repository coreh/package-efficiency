import sqlglot
from sqlglot import exp

OPS = {exp.And: 'and', exp.Or: 'or', exp.EQ: '=', exp.NEQ: '<>', exp.LT: '<', exp.GT: '>',
       exp.LTE: '<=', exp.GTE: '>=', exp.Like: 'like'}


def cond(node):
    while isinstance(node, exp.Paren):
        node = node.this
    op = OPS.get(type(node))
    if op is not None:
        return [op, cond(node.this), cond(node.expression)]
    if isinstance(node, exp.Column):
        table = node.args.get('table')
        return ['col', table.name if table else None, node.name]
    if node.is_string:
        return ['str', node.name]
    return ['num', int(node.name)]


def where_of(node):
    w = node.args.get('where')
    return cond(w.this) if w else None


def operation(sql):
    tree = sqlglot.parse_one(sql)
    if isinstance(tree, exp.Select):
        tables = [tree.args['from_'].this.name]
        tables.extend(j.this.name for j in tree.args.get('joins') or [])
        return {'kind': 'select', 'tables': tables, 'columns': [],
                'items': len(tree.expressions), 'where': where_of(tree)}
    if isinstance(tree, exp.Insert):
        schema = tree.this
        return {'kind': 'insert', 'tables': [schema.this.name],
                'columns': [c.name for c in schema.expressions],
                'items': len(tree.expression.expressions), 'where': None}
    if isinstance(tree, exp.Update):
        return {'kind': 'update', 'tables': [tree.this.name],
                'columns': [e.this.name for e in tree.expressions],
                'items': 0, 'where': where_of(tree)}
    if isinstance(tree, exp.Delete):
        return {'kind': 'delete', 'tables': [tree.this.name], 'columns': [],
                'items': 0, 'where': where_of(tree)}
    schema = tree.this
    return {'kind': 'create_table', 'tables': [schema.this.name],
            'columns': [c.name for c in schema.expressions if isinstance(c, exp.ColumnDef)],
            'items': 0, 'where': None}
