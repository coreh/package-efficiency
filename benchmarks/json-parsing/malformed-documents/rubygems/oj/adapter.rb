require 'oj'
def operation(value)
  Oj.load(value, mode: :strict)
rescue Oj::ParseError
  nil
end
