import cramjam
def operation(value):
    return bytes(cramjam.lz4.decompress_block(cramjam.lz4.compress_block(value.encode('utf-8')))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(bytes(cramjam.lz4.compress_block(text.encode('utf-8'))))}
