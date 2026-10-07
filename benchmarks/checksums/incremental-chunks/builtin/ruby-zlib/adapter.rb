require 'zlib'
def operation(chunks)
  crc = 0
  chunks.each { |chunk| crc = Zlib.crc32(chunk, crc) }
  crc
end
