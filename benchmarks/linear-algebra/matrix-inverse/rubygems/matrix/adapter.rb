require 'matrix'
def operation(value)
  n = value["n"]
  Matrix.rows(value["a"].each_slice(n).to_a, false).inverse
end

def describe(result)
  result.to_a.flatten
end
