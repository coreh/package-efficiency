require 'sorted_set'

def operation(value)
  a = SortedSet.new(value["a"])
  b = SortedSet.new(value["b"])
  [a | b.to_a, a & b, a - b]
end

def describe(result)
  result.map(&:to_a)
end
