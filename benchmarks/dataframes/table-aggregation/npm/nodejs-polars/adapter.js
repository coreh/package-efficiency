import pl from 'nodejs-polars'
// Not timed: the data frame is built once per fixture.
export const prepare = ({ key, qty, amount, min }) => ({ df: pl.DataFrame({ key, qty, amount }), min })
export const operation = ({ df, min }) =>
  df
    .filter(pl.col('qty').gtEq(min))
    .groupBy('key')
    .agg(pl.col('amount').sum().alias('sum'), pl.col('qty').mean().alias('mean'))
    .rows()
