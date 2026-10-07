import { ArgumentParser } from 'argparse'
const parser = new ArgumentParser()
parser.add_argument('-v', '--verbose', { action: 'store_true' })
parser.add_argument('-d', '--dry-run', { action: 'store_true' })
parser.add_argument('-n', '--name')
parser.add_argument('-c', '--count', { type: 'int' })
parser.add_argument('-t', '--tag', { action: 'append', default: [] })
parser.add_argument('files', { nargs: '*' })
export const operation = ({ argv }) => {
  const r = parser.parse_intermixed_args(argv)
  return { verbose: r.verbose, dry: r.dry_run, name: r.name ?? null, count: r.count ?? null, tags: r.tag, files: r.files }
}
