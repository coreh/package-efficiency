require 'zlib'

# Untimed, once per fixture: the hex string becomes a binary String.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(value)
  Zlib.adler32(value)
end
