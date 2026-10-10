require 'digest'

def operation(value)
  Digest::MD5.digest(value)
end

def describe(result)
  result.bytes
end
