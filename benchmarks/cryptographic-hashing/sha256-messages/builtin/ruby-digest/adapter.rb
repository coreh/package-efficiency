require 'digest'

def operation(value)
  Digest::SHA256.digest(value)
end

def describe(result)
  result.bytes
end
