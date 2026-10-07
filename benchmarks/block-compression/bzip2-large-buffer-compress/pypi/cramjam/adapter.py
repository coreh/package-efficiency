import cramjam
def operation(value):
    return bytes(cramjam.bzip2.compress(value.encode('utf-8'), level=9))

# Verifier only (not timed): decompresses the result and reports its size.
def describe(packed):
    return {'text': bytes(cramjam.bzip2.decompress(packed)).decode('utf-8'), 'compressedBytes': len(packed)}
