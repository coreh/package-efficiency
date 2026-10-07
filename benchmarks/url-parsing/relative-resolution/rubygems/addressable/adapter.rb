require 'addressable/uri'
def operation(value)
  Addressable::URI.join(value[0], value[1]).to_s
end
