require 'zlib'
def operation(value)
  deflater = Zlib::Deflate.new(Zlib::DEFAULT_COMPRESSION, -Zlib::MAX_WBITS)
  out = deflater.deflate(value, Zlib::FINISH)
  deflater.close
  out
end

# Verifier only (not timed): bytes as an array of integers.
def describe(result)
  result.bytes
end
