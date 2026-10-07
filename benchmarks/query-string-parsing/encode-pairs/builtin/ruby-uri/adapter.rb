require 'uri'

def operation(value)
  URI.encode_www_form(value)
end
