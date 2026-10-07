import cramjam
def operation(value):
    return bytes(cramjam.bzip2.decompress(cramjam.bzip2.compress(value.encode('utf-8'), level=9))).decode('utf-8')

# Verifier only (not timed): adds the size of what the same compression call produces.
def describe(text):
    return {'text': text, 'compressedBytes': len(bytes(cramjam.bzip2.compress(text.encode('utf-8'), level=9)))}
