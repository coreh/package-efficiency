def operation(value)
  data, limit = value
  data.lazy.map { |x| x * 3 + 1 }.select { |x| x % 5 != 0 }.first(limit).sum
end
