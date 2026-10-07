require 'bigdecimal'

def fmt(v)
  v.is_a?(Integer) ? v.to_s : v.to_s('F').chomp('.0')
end

def operation(pair)
  x = BigDecimal(pair[0])
  y = BigDecimal(pair[1])
  q, r = x.divmod(y)
  [fmt(x * y), fmt(q), fmt(r)]
end
