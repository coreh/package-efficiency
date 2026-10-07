require 'msgpack'

def operation(value)
  MessagePack.unpack(MessagePack.pack(value))
end

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result)
  { decoded: result, encodedBytes: MessagePack.pack(result).bytesize }
end
