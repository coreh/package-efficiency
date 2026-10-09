import { parseArgs } from '@pkgjs/parseargs'
const options = {
  verbose: { type: 'boolean', short: 'v' },
  'dry-run': { type: 'boolean', short: 'd' },
  force: { type: 'boolean', short: 'f' },
  name: { type: 'string', short: 'n' },
  count: { type: 'string', short: 'c' },
  tag: { type: 'string', short: 't', multiple: true }
}
export const operation = ({ argv }) => {
  const { values, positionals } = parseArgs({ args: argv, options, allowPositionals: true })
  return { verbose: !!values.verbose, dry: !!values['dry-run'], force: !!values.force, name: values.name ?? null, count: values.count === undefined ? null : Number(values.count), tags: values.tag ?? [], files: positionals }
}
