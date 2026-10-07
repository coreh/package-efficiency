import brotli
def operation(value):
    return brotli.compress(value.encode('utf-8'))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': brotli.decompress(packed).decode('utf-8'), 'compressedBytes': len(packed)}
