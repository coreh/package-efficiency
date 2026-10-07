require 'http/cookie'

def operation(value)
  HTTP::Cookie.cookie_value_to_hash(value)
end
