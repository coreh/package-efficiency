require 'zlib'
def operation(value)
  Zlib.gunzip(Zlib.gzip(value)).force_encoding(Encoding::UTF_8)
end

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text)
  { 'text' => text, 'compressedBytes' => Zlib.gzip(text).bytesize }
end
