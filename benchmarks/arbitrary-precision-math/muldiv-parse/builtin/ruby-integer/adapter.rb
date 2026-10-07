def operation(pair)
  x = Integer(pair[0], 10)
  y = Integer(pair[1], 10)
  q, r = x.divmod(y)
  [(x * y).to_s, q.to_s, r.to_s]
end
