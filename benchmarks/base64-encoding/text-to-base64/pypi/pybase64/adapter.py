import pybase64
def operation(value):
    return pybase64.b64encode(value.encode('utf-8'))

# bytes to text for the verifier, outside measured work.
def describe(encoded):
    return encoded.decode('ascii')
