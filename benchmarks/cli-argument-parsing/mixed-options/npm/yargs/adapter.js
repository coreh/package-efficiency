import yargs from 'yargs'
const parser = yargs()
  .options({
    verbose: { alias: 'v', type: 'boolean' },
    'dry-run': { alias: 'd', type: 'boolean' },
    name: { alias: 'n', type: 'string' },
    count: { alias: 'c', type: 'number' },
    tag: { alias: 't', type: 'string', array: false }
  })
  .help(false)
  .version(false)
  .exitProcess(false)
export const operation = ({ argv }) => {
  const r = parser.parseSync(argv)
  return { verbose: !!r.verbose, dry: !!r['dry-run'], name: r.name ?? null, count: r.count ?? null, tags: r.tag === undefined ? [] : [].concat(r.tag), files: r._ }
}
