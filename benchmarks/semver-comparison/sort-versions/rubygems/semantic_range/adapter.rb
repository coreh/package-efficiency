require 'semantic_range'

def operation(values)
  parsed = values.map { |v| SemanticRange::Version.new(v) }
  order = (0...values.length).sort { |a, b| parsed[a].compare(parsed[b]) }
  order.map { |i| values[i] }
end
