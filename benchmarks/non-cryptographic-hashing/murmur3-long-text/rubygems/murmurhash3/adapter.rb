require 'murmurhash3'
def operation(value)
  MurmurHash3::V32.str_hash(value, 0)
end
