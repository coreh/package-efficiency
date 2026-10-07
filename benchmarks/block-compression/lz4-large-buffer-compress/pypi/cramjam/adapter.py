import cramjam
def operation(value):
    return bytes(cramjam.lz4.compress_block(value.encode('utf-8')))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': bytes(cramjam.lz4.decompress_block(packed)).decode('utf-8'), 'compressedBytes': len(packed)}
