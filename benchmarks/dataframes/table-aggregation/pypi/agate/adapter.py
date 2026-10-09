import agate

# Not timed: the Table is built once per fixture.
def prepare(value):
    names = ['key', 'qty', 'amount']
    types = [agate.Number(), agate.Number(), agate.Number()]
    rows = list(zip(value['key'], value['qty'], value['amount']))
    return agate.Table(rows, names, types), value['min']

def operation(prepared):
    table, minimum = prepared
    out = table.where(lambda row: row['qty'] >= minimum).group_by('key').aggregate([
        ('total', agate.Sum('amount')), ('mean', agate.Mean('qty'))])
    return [[r['key'], r['total'], r['mean']] for r in out.rows]

def describe(result):
    return [[float(k), float(s), float(m)] for k, s, m in result]
