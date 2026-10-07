import pybase64
def operation(value):
    return pybase64.b64decode(value)

# list of byte values for the verifier, outside measured work.
def describe(decoded):
    return list(decoded)
