import { parseArgs } from '@std/cli/parse-args'
const options = {
  boolean: ['verbose', 'dry-run'],
  string: ['name', 'tag'],
  collect: ['tag'],
  alias: { verbose: 'v', 'dry-run': 'd', name: 'n', count: 'c', tag: 't' }
}
export const operation = ({ argv }) => {
  const r = parseArgs(argv, options)
  return { verbose: r.verbose, dry: r['dry-run'], name: r.name ?? null, count: r.count ?? null, tags: r.tag ?? [], files: r._ }
}
