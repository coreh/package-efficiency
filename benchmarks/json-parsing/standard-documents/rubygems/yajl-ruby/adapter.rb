require 'yajl'
def operation(value)
  Yajl::Parser.parse(value)
end
