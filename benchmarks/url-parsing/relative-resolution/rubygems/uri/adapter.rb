require 'uri'
def operation(value)
  URI.join(value[0], value[1]).to_s
end
