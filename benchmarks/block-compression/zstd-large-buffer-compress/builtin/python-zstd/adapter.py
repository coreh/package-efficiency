from compression import zstd
def operation(value):
    return zstd.compress(value.encode('utf-8'))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': zstd.decompress(packed).decode('utf-8'), 'compressedBytes': len(packed)}
