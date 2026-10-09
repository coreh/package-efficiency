import { jack } from 'jackspeak'
const j = jack()
  .flag({ verbose: { short: 'v' }, 'dry-run': { short: 'd' }, force: { short: 'f' } })
  .opt({ name: { short: 'n' } })
  .num({ count: { short: 'c' } })
  .optList({ tag: { short: 't' } })
export const operation = ({ argv }) => {
  const { values: r, positionals } = j.parse(argv)
  return { verbose: !!r.verbose, dry: !!r['dry-run'], force: !!r.force, name: r.name ?? null, count: r.count ?? null, tags: r.tag ?? [], files: positionals }
}
