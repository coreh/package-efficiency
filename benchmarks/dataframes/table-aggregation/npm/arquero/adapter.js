import * as aq from 'arquero'
// Not timed: the table is built once per fixture.
export const prepare = ({ key, qty, amount, min }) => ({ table: aq.table({ key, qty, amount }), min })
export const operation = ({ table, min }) => {
  const out = table
    .params({ min })
    .filter((d, $) => d.qty >= $.min)
    .groupby('key')
    .rollup({ sum: (d) => aq.op.sum(d.amount), mean: (d) => aq.op.mean(d.qty) })
  const key = out.array('key'), sum = out.array('sum'), mean = out.array('mean')
  return key.map((k, i) => [k, sum[i], mean[i]])
}
