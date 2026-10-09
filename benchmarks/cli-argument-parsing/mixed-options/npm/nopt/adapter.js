import nopt from 'nopt'
const known = { verbose: Boolean, 'dry-run': Boolean, name: String, count: Number, tag: [String, Array] }
const shorthands = { v: ['--verbose'], d: ['--dry-run'], n: ['--name'], c: ['--count'], t: ['--tag'] }
export const operation = ({ argv }) => {
  const r = nopt(known, shorthands, argv, 0)
  return { verbose: !!r.verbose, dry: !!r['dry-run'], name: r.name ?? null, count: r.count ?? null, tags: r.tag ?? [], files: r.argv.remain }
}
