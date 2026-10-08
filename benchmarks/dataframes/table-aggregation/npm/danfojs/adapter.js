import * as dfd from 'danfojs'
// Not timed: the DataFrame is built once per fixture.
export const prepare = ({ key, qty, amount, min }) => ({ df: new dfd.DataFrame({ key, qty, amount }), min })
export const operation = ({ df, min }) => {
  const out = df.query(df['qty'].ge(min)).groupby(['key']).agg({ amount: 'sum', qty: 'mean' })
  return dfd.toJSON(out, { format: 'row' }) && out.values
}
