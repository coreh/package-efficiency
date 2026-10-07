def operation(value)
  Marshal.load(Marshal.dump(value))
end

# Not timed: runs once per fixture for the verifier. The timed call returns only
# the decoded value, so the byte length comes from encoding it once more here.
def describe(result)
  encoded = Marshal.dump(result)
  { decoded: result, encodedBytes: encoded.is_a?(String) && encoded.encoding == Encoding::BINARY ? encoded.bytesize : 0 }
end
