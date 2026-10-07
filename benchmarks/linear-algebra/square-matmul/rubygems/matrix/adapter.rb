require 'matrix'
def operation(value)
  n = value["n"]
  a = Matrix.rows(value["a"].each_slice(n).to_a, false)
  b = Matrix.rows(value["b"].each_slice(n).to_a, false)
  a * b
end

def describe(result)
  result.to_a.flatten
end
