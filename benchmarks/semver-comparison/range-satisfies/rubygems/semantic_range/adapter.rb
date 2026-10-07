require 'semantic_range'

def operation(pair)
  SemanticRange.satisfies?(pair[0], pair[1])
end
