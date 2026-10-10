import brotli

# Untimed, once per fixture: the binary string becomes bytes.
def prepare(value):
    return value.encode('latin-1')

def operation(data):
    return brotli.decompress(data)

# Verifier only (not timed): the bytes as a binary string.
def describe(out):
    return out.decode('latin-1')
