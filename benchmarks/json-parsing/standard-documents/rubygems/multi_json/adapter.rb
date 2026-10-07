require 'multi_json'
def operation(value)
  MultiJson.load(value)
end
