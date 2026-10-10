require 'openssl'

# Untimed, once per fixture: the hex string becomes a binary String.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(value)
  OpenSSL::Digest.digest('BLAKE2b512', value)
end

def describe(result)
  result.bytes
end
