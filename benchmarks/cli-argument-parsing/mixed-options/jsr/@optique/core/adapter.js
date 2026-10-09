import { object, option, argument, optional, multiple, parse, string, integer } from '@optique/core'
const parser = object({
  verbose: option('-v', '--verbose'),
  dry: option('-d', '--dry-run'),
  name: optional(option('-n', '--name', string())),
  count: optional(option('-c', '--count', integer())),
  tags: multiple(option('-t', '--tag', string())),
  files: multiple(argument(string()))
})
export const operation = ({ argv }) => {
  const r = parse(parser, argv)
  if (!r.success) throw new Error('parse failed')
  const v = r.value
  return { verbose: v.verbose, dry: v.dry, name: v.name ?? null, count: v.count ?? null, tags: v.tags, files: v.files }
}
