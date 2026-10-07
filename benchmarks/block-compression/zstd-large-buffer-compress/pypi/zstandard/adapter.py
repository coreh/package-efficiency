import zstandard
def operation(value):
    return zstandard.compress(value.encode('utf-8'))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': zstandard.decompress(packed).decode('utf-8'), 'compressedBytes': len(packed)}
