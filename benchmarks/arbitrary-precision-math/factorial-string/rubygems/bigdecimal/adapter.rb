require 'bigdecimal'

def operation(n)
  r = BigDecimal(1)
  (2..n).each { |i| r *= i }
  r.to_s('F').chomp('.0')
end
