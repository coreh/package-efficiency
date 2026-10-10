require 'set'

def operation(value)
  a = Set.new(value["a"])
  b = Set.new(value["b"])
  [a | b, a & b, a - b]
end

def describe(result)
  result.map(&:to_a)
end
