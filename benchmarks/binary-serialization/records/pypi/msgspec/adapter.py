import msgspec

_encode = msgspec.msgpack.encode
_decode = msgspec.msgpack.decode

def operation(value):
    return _decode(_encode(value))

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result):
    return {'decoded': result, 'encodedBytes': len(_encode(result))}
