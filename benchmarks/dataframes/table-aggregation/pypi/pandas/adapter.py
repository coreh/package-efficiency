import pandas as pd

# Not timed: the DataFrame is built once per fixture.
def prepare(value):
    return pd.DataFrame({'key': value['key'], 'qty': value['qty'], 'amount': value['amount']}), value['min']

def operation(prepared):
    df, minimum = prepared
    out = df[df['qty'] >= minimum].groupby('key').agg(total=('amount', 'sum'), mean=('qty', 'mean')).reset_index()
    return out.values.tolist()
