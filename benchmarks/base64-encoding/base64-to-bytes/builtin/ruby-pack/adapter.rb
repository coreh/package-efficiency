def operation(value)
  value.unpack1('m0')
end

# Byte list for the verifier, outside measured work.
def describe(decoded)
  decoded.bytes
end
