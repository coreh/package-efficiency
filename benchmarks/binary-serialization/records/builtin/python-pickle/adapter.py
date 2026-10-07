import pickle

def operation(value):
    return pickle.loads(pickle.dumps(value))

# Not timed: runs once per fixture for the verifier. The timed call returns only
# the decoded value, so the byte length comes from encoding it once more here.
def describe(result):
    encoded = pickle.dumps(result)
    return {'decoded': result, 'encodedBytes': len(encoded) if isinstance(encoded, bytes) else 0}
