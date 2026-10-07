require 'base64'
def operation(value)
  Base64.strict_encode64(value)
end
