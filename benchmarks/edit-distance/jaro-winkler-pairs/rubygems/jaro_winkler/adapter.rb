require 'jaro_winkler'

def operation(value)
  value.map { |pair| JaroWinkler.similarity(pair[0], pair[1]) }
end
