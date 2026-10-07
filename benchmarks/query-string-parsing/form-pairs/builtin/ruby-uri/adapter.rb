require 'uri'

def operation(value)
  URI.decode_www_form(value).to_h
end
