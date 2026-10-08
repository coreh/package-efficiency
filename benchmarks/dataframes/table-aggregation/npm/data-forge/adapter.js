import dataForge from 'data-forge'
// Not timed: the data frame is built once per fixture.
export const prepare = ({ key, qty, amount, min }) => ({
  df: new dataForge.DataFrame({ columnNames: ['key', 'qty', 'amount'], rows: key.map((k, i) => [k, qty[i], amount[i]]) }),
  min,
})
export const operation = ({ df, min }) =>
  df
    .where((row) => row.qty >= min)
    .groupBy((row) => row.key)
    .select((group) => [group.first().key, group.deflate((row) => row.amount).sum(), group.deflate((row) => row.qty).average()])
    .toArray()
