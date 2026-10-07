require 'json'
def operation(value)
  JSON.parse(value)
rescue JSON::ParserError
  nil
end
