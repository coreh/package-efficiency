require 'multi_json'
def operation(value)
  MultiJson.load(value)
rescue MultiJson::ParseError
  nil
end
