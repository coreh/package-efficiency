# Untimed, once per fixture: the hex string becomes a binary String.
def prepare(value)
  [value].pack('H*').freeze
end

def operation(value)
  value.count("\n")
end
