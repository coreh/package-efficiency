require 'jmespath'

# Not timed: runs once per fixture.
def prepare(input)
  parser = JMESPath::Parser.new
  [input['document'], input['expressions'].map { |e| parser.parse(e).optimize }]
end

def operation(prepared)
  document, compiled = prepared
  compiled.map { |c| c.visit(document) }
end
