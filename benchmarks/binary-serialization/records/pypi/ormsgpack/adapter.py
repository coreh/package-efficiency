import ormsgpack

def operation(value):
    return ormsgpack.unpackb(ormsgpack.packb(value))

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result):
    return {'decoded': result, 'encodedBytes': len(ormsgpack.packb(result))}
