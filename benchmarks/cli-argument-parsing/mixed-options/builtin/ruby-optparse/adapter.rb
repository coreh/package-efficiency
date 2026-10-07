require 'optparse'

STATE = {}
PARSER = OptionParser.new
PARSER.on('-v', '--verbose') { STATE['verbose'] = true }
PARSER.on('-d', '--dry-run') { STATE['dry'] = true }
PARSER.on('-n', '--name TEXT') { |v| STATE['name'] = v }
PARSER.on('-c', '--count INT', Integer) { |v| STATE['count'] = v }
PARSER.on('-t', '--tag TEXT') { |v| STATE['tags'] << v }

def operation(value)
  STATE.replace('verbose' => false, 'dry' => false, 'name' => nil, 'count' => nil, 'tags' => [])
  STATE['files'] = PARSER.parse(value['argv'])
  STATE.dup
end
