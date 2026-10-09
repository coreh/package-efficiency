require 'bson'

# BSON encodes documents only, so the value goes in a one-key document, as any
# BSON user must for a bare array, number or null.
def operation(value)
  BSON::Document.from_bson(BSON::ByteBuffer.new({ 'v' => value }.to_bson.to_s))['v']
end

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result)
  { decoded: result, encodedBytes: { 'v' => result }.to_bson.to_s.bytesize }
end
