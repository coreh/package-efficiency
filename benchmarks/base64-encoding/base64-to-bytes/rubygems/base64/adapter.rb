require 'base64'
def operation(value)
  Base64.strict_decode64(value)
end

# Byte list for the verifier, outside measured work.
def describe(decoded)
  decoded.bytes
end
