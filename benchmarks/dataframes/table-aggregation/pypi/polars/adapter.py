import polars as pl

# Not timed: the DataFrame is built once per fixture.
def prepare(value):
    return pl.DataFrame({'key': value['key'], 'qty': value['qty'], 'amount': value['amount']}), value['min']

def operation(prepared):
    df, minimum = prepared
    out = df.filter(pl.col('qty') >= minimum).group_by('key').agg(
        pl.col('amount').sum().alias('total'), pl.col('qty').mean().alias('mean'))
    return list(zip(out['key'].to_list(), out['total'].to_list(), out['mean'].to_list()))
