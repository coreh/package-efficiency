import cbor2

def operation(value):
    return cbor2.loads(cbor2.dumps(value))

# Not timed: runs once per fixture for the verifier. The byte length comes from
# encoding the decoded value once more here.
def describe(result):
    return {'decoded': result, 'encodedBytes': len(cbor2.dumps(result))}
