import dask
import dask.dataframe as dd

dask.config.set(scheduler='synchronous')

# Not timed: the Dask DataFrame is built once per fixture.
def prepare(value):
    cols = {'key': value['key'], 'qty': value['qty'], 'amount': value['amount']}
    return dd.from_dict(cols, npartitions=4), value['min']

def operation(prepared):
    df, minimum = prepared
    out = df[df['qty'] >= minimum].groupby('key').agg(total=('amount', 'sum'), mean=('qty', 'mean')).reset_index().compute()
    return out.values.tolist()
