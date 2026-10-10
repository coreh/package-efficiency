require 'digest'

# Untimed, once per fixture: the hex string becomes a binary String.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(value)
  Digest::SHA1.digest(value)
end

def describe(result)
  result.bytes
end
