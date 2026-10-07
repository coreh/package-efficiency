def operation(n)
  r = 1
  (2..n).each { |i| r *= i }
  r.to_s
end
