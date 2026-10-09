require 'thor'

OPTIONS = {
  'verbose' => Thor::Option.new('verbose', type: :boolean, aliases: ['-v']),
  'dry-run' => Thor::Option.new('dry-run', type: :boolean, aliases: ['-d']),
  'name' => Thor::Option.new('name', type: :string, aliases: ['-n']),
  'count' => Thor::Option.new('count', type: :numeric, aliases: ['-c']),
  'tag' => Thor::Option.new('tag', type: :string, repeatable: true, aliases: ['-t'])
}

def operation(value)
  parser = Thor::Options.new(OPTIONS)
  r = parser.parse(value['argv'])
  { 'verbose' => r['verbose'] || false, 'dry' => r['dry-run'] || false, 'name' => r['name'], 'count' => r['count'], 'tags' => r['tag'] || [], 'files' => parser.remaining }
end
