require 'tomlrb'

def operation(value)
  Tomlrb.parse(value)
  true
rescue Tomlrb::ParseError
  false
end
