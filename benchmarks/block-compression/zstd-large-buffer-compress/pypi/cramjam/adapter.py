import cramjam
def operation(value):
    return bytes(cramjam.zstd.compress(value.encode('utf-8')))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': bytes(cramjam.zstd.decompress(packed)).decode('utf-8'), 'compressedBytes': len(packed)}
