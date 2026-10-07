import { parseFlags } from '@cliffy/flags'
const options = {
  flags: [
    { name: 'verbose', aliases: ['v'] },
    { name: 'dry-run', aliases: ['d'] },
    { name: 'name', aliases: ['n'], type: 'string', args: [{ type: 'string' }] },
    { name: 'count', aliases: ['c'], type: 'integer', args: [{ type: 'integer' }] },
    { name: 'tag', aliases: ['t'], type: 'string', args: [{ type: 'string' }], collect: true }
  ]
}
export const operation = ({ argv }) => {
  const r = parseFlags(argv, options)
  return { verbose: !!r.flags.verbose, dry: !!r.flags.dryRun, name: r.flags.name ?? null, count: r.flags.count ?? null, tags: r.flags.tag ?? [], files: r.literal.length ? [...r.unknown, ...r.literal] : r.unknown }
}
