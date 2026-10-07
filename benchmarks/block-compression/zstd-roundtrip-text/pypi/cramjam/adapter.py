import cramjam
def operation(value):
    return bytes(cramjam.zstd.decompress(cramjam.zstd.compress(value.encode('utf-8')))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(bytes(cramjam.zstd.compress(text.encode('utf-8'))))}
