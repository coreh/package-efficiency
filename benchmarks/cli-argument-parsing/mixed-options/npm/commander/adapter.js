import { Command } from 'commander'
const collect = (value, previous) => previous.concat([value])
const program = new Command()
  .exitOverride()
  .option('-v, --verbose')
  .option('-d, --dry-run')
  .option('-n, --name <text>')
  .option('-c, --count <int>', '', Number)
  .option('-t, --tag <text>', '', collect, [])
  .argument('[files...]')
export const operation = ({ argv }) => {
  program.parse(argv, { from: 'user' })
  const o = program.opts()
  return { verbose: !!o.verbose, dry: !!o.dryRun, name: o.name ?? null, count: o.count ?? null, tags: o.tag, files: program.args }
}
