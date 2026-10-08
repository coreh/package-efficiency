require 'jsonpath'

def operation(value)
  JsonPath.new(value['query']).on(value['document'])
end
