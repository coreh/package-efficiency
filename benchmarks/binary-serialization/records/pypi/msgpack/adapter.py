import msgpack

def operation(value):
    return msgpack.unpackb(msgpack.packb(value))

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result):
    return {'decoded': result, 'encodedBytes': len(msgpack.packb(result))}
