require 'matrix'

# Untimed, once per fixture: each row-major array becomes a Matrix.
def prepare(value)
  value["matrices"].map { |a| Matrix.rows(a.each_slice(4).to_a, false) }
end

def operation(ms)
  product = ms.reduce(:*)
  [product, product.inverse]
end

def describe(result)
  result.map { |m| m.to_a.flatten }
end
