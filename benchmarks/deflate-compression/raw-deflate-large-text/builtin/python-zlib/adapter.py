import zlib
def operation(value):
    c = zlib.compressobj(wbits=-15)
    return c.compress(value.encode('utf-8')) + c.flush()

# Verifier only (not timed): bytes as a list of integers.
def describe(result):
    return list(result)
