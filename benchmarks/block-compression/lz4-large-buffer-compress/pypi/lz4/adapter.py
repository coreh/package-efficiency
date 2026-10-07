import lz4.block
def operation(value):
    return lz4.block.compress(value.encode('utf-8'))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': lz4.block.decompress(packed).decode('utf-8'), 'compressedBytes': len(packed)}
