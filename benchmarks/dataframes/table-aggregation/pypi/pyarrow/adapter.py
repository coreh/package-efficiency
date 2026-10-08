import pyarrow as pa
import pyarrow.compute as pc

# Not timed: the Table is built once per fixture.
def prepare(value):
    return pa.table({'key': value['key'], 'qty': value['qty'], 'amount': value['amount']}), value['min']

def operation(prepared):
    table, minimum = prepared
    kept = table.filter(pc.greater_equal(table['qty'], minimum))
    out = kept.group_by('key').aggregate([('amount', 'sum'), ('qty', 'mean')])
    return list(zip(out['key'].to_pylist(), out['amount_sum'].to_pylist(), out['qty_mean'].to_pylist()))
