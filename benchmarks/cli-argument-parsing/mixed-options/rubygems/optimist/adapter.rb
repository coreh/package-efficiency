require 'optimist'

PARSER = Optimist::Parser.new do
  opt :verbose, 'verbose', short: 'v'
  opt :dry_run, 'dry run', short: 'd'
  opt :name, 'name', type: :string, short: 'n'
  opt :count, 'count', type: :integer, short: 'c'
  opt :tag, 'tag', type: :string, multi: true, short: 't'
end

def operation(value)
  r = PARSER.parse(value['argv'].dup)
  { 'verbose' => r[:verbose], 'dry' => r[:dry_run], 'name' => r[:name], 'count' => r[:count], 'tags' => r[:tag], 'files' => PARSER.leftovers }
end
