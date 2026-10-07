import cramjam
def operation(value):
    return bytes(cramjam.brotli.decompress(cramjam.brotli.compress(value.encode('utf-8')))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(bytes(cramjam.brotli.compress(text.encode('utf-8'))))}
