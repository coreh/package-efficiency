import optionator from 'optionator'
const parser = optionator({
  prepend: 'usage',
  concatRepeatedArrays: true,
  options: [
    { option: 'verbose', alias: 'v', type: 'Boolean' },
    { option: 'dry-run', alias: 'd', type: 'Boolean' },
    { option: 'name', alias: 'n', type: 'String' },
    { option: 'count', alias: 'c', type: 'Int' },
    { option: 'tag', alias: 't', type: '[String]' }
  ]
})
export const operation = ({ argv }) => {
  const r = parser.parse(argv, { slice: 0 })
  return { verbose: !!r.verbose, dry: !!r.dryRun, name: r.name ?? null, count: r.count ?? null, tags: r.tag ?? [], files: r._ }
}
