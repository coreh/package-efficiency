import minimist from 'minimist'
const config = {
  boolean: ['verbose', 'dry-run'],
  string: ['name', 'tag'],
  alias: { verbose: 'v', 'dry-run': 'd', name: 'n', count: 'c', tag: 't' }
}
export const operation = ({ argv }) => {
  const r = minimist(argv, config)
  return { verbose: r.verbose, dry: r['dry-run'], name: r.name === undefined ? null : r.name, count: r.count === undefined ? null : r.count, tags: r.tag === undefined ? [] : [].concat(r.tag), files: r._ }
}
