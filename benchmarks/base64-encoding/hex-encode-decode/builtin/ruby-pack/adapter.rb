# Untimed, once per fixture: the list of byte values becomes a binary String.
def prepare(value)
  value.pack('C*').freeze
end

def operation(value)
  text = value.unpack1('H*')
  [text, [text].pack('H*')]
end

# Byte list for the verifier, outside measured work.
def describe(result)
  [result[0], result[1].bytes]
end
