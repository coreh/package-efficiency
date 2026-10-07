import parser from 'yargs-parser'
const config = {
  boolean: ['verbose', 'dry-run'],
  string: ['name', 'tag'],
  number: ['count'],
  alias: { verbose: 'v', 'dry-run': 'd', name: 'n', count: 'c', tag: 't' }
}
export const operation = ({ argv }) => {
  const r = parser(argv, config)
  return { verbose: !!r.verbose, dry: !!r['dry-run'], name: r.name ?? null, count: r.count ?? null, tags: r.tag === undefined ? [] : [].concat(r.tag), files: r._ }
}
