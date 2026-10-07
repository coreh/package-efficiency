require 'slop'

OPTIONS = Slop::Options.new
OPTIONS.bool '-v', '--verbose'
OPTIONS.bool '-d', '--dry-run'
OPTIONS.string '-n', '--name'
OPTIONS.integer '-c', '--count'
OPTIONS.array '-t', '--tag'
PARSER = Slop::Parser.new(OPTIONS)

def operation(value)
  r = PARSER.parse(value['argv'])
  { 'verbose' => r[:verbose], 'dry' => r[:'dry-run'], 'name' => r[:name], 'count' => r[:count], 'tags' => r[:tag], 'files' => r.arguments }
end
