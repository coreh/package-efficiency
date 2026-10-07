require 'zlib'
def operation(value)
  Zlib.crc32(value)
end
