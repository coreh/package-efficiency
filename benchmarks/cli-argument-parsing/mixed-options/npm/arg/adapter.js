import arg from 'arg'
const spec = {
  '--verbose': Boolean, '-v': '--verbose',
  '--dry-run': Boolean, '-d': '--dry-run',
  '--name': String, '-n': '--name',
  '--count': Number, '-c': '--count',
  '--tag': [String], '-t': '--tag'
}
export const operation = ({ argv }) => {
  const r = arg(spec, { argv })
  return { verbose: !!r['--verbose'], dry: !!r['--dry-run'], name: r['--name'] ?? null, count: r['--count'] ?? null, tags: r['--tag'] ?? [], files: r._ }
}
